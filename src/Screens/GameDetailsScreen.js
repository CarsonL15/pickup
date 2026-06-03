import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import PlayerDot from '../components/PlayerDot';
import './GameDetailsScreen.css';

// ─── Game Details ──────────────────────────────────────────────────────────────
// Reached from the Finding Game lobby once the game fills:
//   navigate('/GameDetailsScreen', { state: { gameId, mode } });
// Loads the real roster from game_player (+ app_user usernames) and keeps it live
// via realtime. Competitive splits by team_side; casual is a flat grid.
//
// LEAVE handoff into the post-game flow:
//   casual      → remove self from game_player → Home (no rating). The casual game
//                 is ended (is_active=false) as soon as this screen loads.
//   competitive → remove self → captain goes to /PostGameScreen (report win/loss),
//                 everyone else goes straight to /RatingScreen.
//
// Captain: game_player has no is_captain column yet, so until matchmaking sets one
// we DERIVE it — the highest-sportsmanship player on each team_side (tiebreak lowest
// user_id) is the captain. Deterministic, so both clients agree. If a real is_captain
// column appears later, it takes precedence automatically.
// ───────────────────────────────────────────────────────────────────────────────

// captain = highest sportsmanship on a team, tiebreak lowest user_id
function pickCaptain(players) {
  if (!players.length) return null;
  return players.reduce((best, p) => {
    const bs = best.sportsmanship ?? -Infinity;
    const ps = p.sportsmanship ?? -Infinity;
    if (ps > bs) return p;
    if (ps === bs && p.user_id < best.user_id) return p;
    return best;
  });
}

function GameDetailsScreen() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const gameId = state?.gameId ?? null;
  const [mode, setMode] = useState(state?.mode ?? 'casual');
  const [parkName, setParkName] = useState('');
  const [roster, setRoster] = useState([]);
  const [myUserId, setMyUserId] = useState(null);

  // resolve my integer user_id (to figure out which side is "your team")
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('app_user').select('user_id').eq('auth_id', user.id).maybeSingle();
      if (!cancelled && data) setMyUserId(data.user_id);
    })();
    return () => { cancelled = true; };
  }, [user]);

  // load roster + game meta, and keep the roster live
  useEffect(() => {
    if (gameId == null) return;
    let cancelled = false;

    async function loadRoster() {
      const { data } = await supabase
        .from('game_player')
        .select('*, app_user(username)')
        .eq('game_id', gameId);
      if (cancelled || !data) return;

      // sportsmanship powers the derived captain (no is_captain column yet)
      const ids = data.map((r) => r.user_id);
      const { data: stats } = ids.length
        ? await supabase.from('user_stats').select('user_id, sportsmanship').in('user_id', ids)
        : { data: [] };
      const sportById = Object.fromEntries((stats ?? []).map((s) => [s.user_id, s.sportsmanship]));

      const next = data.map((r) => ({
        user_id: r.user_id,
        team_side: r.team_side,
        username: r.app_user?.username ?? null,
        has_ball: r.has_ball,                 // undefined until the column exists
        sportsmanship: sportById[r.user_id] ?? null,
        is_captain: r.is_captain ?? false,    // prefer the real column when it exists
      }));

      // no real captain flag yet → derive one per side from sportsmanship
      if (!next.some((p) => p.is_captain)) {
        for (const side of [1, 2]) {
          const cap = pickCaptain(next.filter((p) => p.team_side === side));
          if (cap) cap.is_captain = true;
        }
      }

      if (!cancelled) setRoster(next);
    }

    async function loadMeta() {
      const { data: g } = await supabase
        .from('game').select('is_casual, is_active, park_id').eq('game_id', gameId).maybeSingle();
      if (cancelled || !g) return;
      if (!state?.mode) setMode(g.is_casual ? 'casual' : 'competitive');
      if (g.park_id != null) {
        const { data: p } = await supabase
          .from('parks').select('park_name').eq('park_id', g.park_id).maybeSingle();
        if (!cancelled && p) setParkName(p.park_name);
      }
      // casual has nothing to resolve — end it the moment details are shown
      if (g.is_casual && g.is_active && !cancelled) {
        await supabase.from('game').update({ is_active: false }).eq('game_id', gameId);
      }
    }

    loadRoster();
    loadMeta();

    // roster is tiny (≤10), so just re-fetch on any change — keeps usernames joined
    const channel = supabase
      .channel(`game-details-${gameId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'game_player', filter: `game_id=eq.${gameId}` },
        () => loadRoster()
      )
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [gameId, state?.mode]);

  const isCompetitive = mode === 'competitive';
  // "your team" = the side the current user is on; fall back to side 1 if unknown
  const myTeamSide = roster.find((p) => p.user_id === myUserId)?.team_side ?? 1;
  const amCaptain = !!roster.find((p) => p.user_id === myUserId)?.is_captain;

  async function handleLeave() {
    if (user && myUserId != null) {
      await supabase.from('game_player').delete()
        .eq('game_id', gameId).eq('user_id', myUserId);
    }

    if (isCompetitive) {
      // captains reconcile the result; everyone else rates straight away
      const navState = { state: { gameId, mySide: myTeamSide } };
      navigate(amCaptain ? '/PostGameScreen' : '/RatingScreen', navState);
    } else {
      navigate('/HomeScreen'); // casual: no rating
    }
  }

  const ProfileNav = (
    <div className="gd-bottom-nav">
      <button aria-label="Profile" onClick={() => navigate('/ProfileScreen')}>
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </button>
    </div>
  );

  if (gameId == null) {
    return (
      <div className="screen gd-screen">
        <h1 className="gd-title">GAME<br />DETAILS</h1>
        <p style={{ color: 'var(--color-text-muted)', width: '100%', textAlign: 'left' }}>
          No game selected.
        </p>
        {ProfileNav}
      </div>
    );
  }

  const yourTeam = roster.filter((p) => p.team_side === myTeamSide);
  const theirTeam = roster.filter((p) => p.team_side !== myTeamSide);

  return (
    <div className="screen gd-screen">

      <h1 className="gd-title">GAME<br />DETAILS</h1>

      {isCompetitive ? (
        <div className="gd-teams">
          <div className="gd-team-block">
            <span className="gd-team-label">YOUR TEAM</span>
            <div className="gd-circles-row">
              {yourTeam.map(p => (
                <PlayerDot key={p.user_id} isCaptain={p.is_captain} hasBall={p.has_ball} username={p.username} />
              ))}
            </div>
          </div>
          <div className="gd-team-block">
            <span className="gd-team-label">THEIR TEAM</span>
            <div className="gd-circles-row">
              {theirTeam.map(p => (
                <PlayerDot key={p.user_id} isCaptain={p.is_captain} hasBall={p.has_ball} username={p.username} />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="gd-teams">
          <span className="gd-team-label">PLAYERS</span>
          <div className="gd-circles-grid">
            {roster.map(p => (
              <PlayerDot key={p.user_id} isCaptain={p.is_captain} hasBall={p.has_ball} username={p.username} />
            ))}
          </div>
        </div>
      )}

      <div className="gd-info">
        <span className="gd-location">{parkName}</span>
      </div>

      <button className="gd-leave-btn" onClick={handleLeave}>LEAVE</button>

      {ProfileNav}

    </div>
  );
}

export default GameDetailsScreen;
