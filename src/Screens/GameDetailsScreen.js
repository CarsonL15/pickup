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
// Captain (red) / ball (purple) dots: game_player has no is_captain/has_ball
// columns yet, so those read as undefined → plain gray dots. We select '*', so
// once those columns are added and the matchmaker populates them, the values flow
// through automatically and PlayerCircle lights them up — no query change needed.
// ───────────────────────────────────────────────────────────────────────────────

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
      setRoster(data.map((r) => ({
        user_id: r.user_id,
        team_side: r.team_side,
        won: r.won,
        username: r.app_user?.username ?? null,
        is_captain: r.is_captain, // undefined until the column exists
        has_ball: r.has_ball,     // undefined until the column exists
      })));
    }

    async function loadMeta() {
      const { data: g } = await supabase
        .from('game').select('is_casual, park_id').eq('game_id', gameId).maybeSingle();
      if (cancelled || !g) return;
      if (!state?.mode) setMode(g.is_casual ? 'casual' : 'competitive');
      if (g.park_id != null) {
        const { data: p } = await supabase
          .from('parks').select('park_name').eq('park_id', g.park_id).maybeSingle();
        if (!cancelled && p) setParkName(p.park_name);
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

  async function handleLeave() {
    if (user && myUserId != null) {
      await supabase.from('game_player').delete().eq('user_id', myUserId);
    }
    navigate('/HomeScreen');
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

  const isCompetitive = mode === 'competitive';
  // "your team" = the side the current user is on; fall back to side 1 if unknown
  const myTeamSide = roster.find((p) => p.user_id === myUserId)?.team_side ?? 1;
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
