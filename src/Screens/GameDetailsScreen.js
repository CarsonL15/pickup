import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import './GameDetailsScreen.css';

// ─── Supabase / matchmaking integration point ─────────────────────────────────
// Reached from matchmaking with a real game id in router state:
//
//   navigate('/GameDetailsScreen', { state: { game: { game_id, is_casual } } });
//
// When a game_id is present we load the live roster from `game_player` (+ usernames
// from `app_user`). Without one we fall back to mock data so the UI still renders
// during development.
//
// Real tables: game(game_id, is_casual, is_active, park_id), game_player(game_id,
// user_id, team_side, party_id), app_user(user_id, auth_id, username, display_name).
// user_id is the integer app_user.user_id; the logged-in user maps via
// app_user.auth_id = auth user.id.
//
// LEAVE behaviour:
//   casual      → remove self from game_player, go Home (no rating, ever). The casual
//                 game is also ended (is_active=false) the moment this screen loads.
//   competitive → remove self from game_player, then captains go to /PostGameScreen
//                 and everyone else goes to /RatingScreen.
// NOTE: the per-player captain flag is provisioned by matchmaking later; until then
// `is_captain` is false for everyone and competitive players route to rating.
// ─────────────────────────────────────────────────────────────────────────────

// Mock data for UI development — used when no game_id is passed in router state.
const MOCK_COMPETITIVE = {
  mode: 'competitive',
  location: 'COMSTOCK PARK',
  time: '10:32',
  yourTeam: [
    { id: '1', username: 'jake',    isReporter: false, hasBall: false },
    { id: '2', username: 'warren',  isReporter: true,  hasBall: false },
    { id: '3', username: 'carson',  isReporter: false, hasBall: false },
    { id: '4', username: 'nicolle', isReporter: false, hasBall: false },
  ],
  theirTeam: [
    { id: '5', username: 'p5', isReporter: false, hasBall: false },
    { id: '6', username: 'p6', isReporter: false, hasBall: false },
    { id: '7', username: 'p7', isReporter: false, hasBall: false },
    { id: '8', username: 'p8', isReporter: true,  hasBall: false },
  ],
};

const MOCK_CASUAL = {
  mode: 'casual',
  location: 'COMSTOCK PARK',
  players: [
    { id: '1', username: 'jake',    hasBall: false },
    { id: '2', username: 'warren',  hasBall: true  },
    { id: '3', username: 'carson',  hasBall: true  },
    { id: '4', username: 'nicolle', hasBall: false },
    { id: '5', username: 'p5',      hasBall: false },
    { id: '6', username: 'p6',      hasBall: false },
    { id: '7', username: 'p7',      hasBall: false },
    { id: '8', username: 'p8',      hasBall: false },
  ],
};

function PlayerCircle({ isReporter, hasBall, mode }) {
  let variant = '';
  if (mode === 'competitive' && isReporter) variant = 'reporter';
  if (mode === 'casual' && hasBall) variant = 'ball';
  return (
    <div className={`gd-circle ${variant}`}>
      {variant === 'reporter' && <span className="gd-circle-label">C</span>}
      {variant === 'ball' && <span className="gd-circle-label">B</span>}
    </div>
  );
}

function GameDetailsScreen() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const incoming = state?.game;
  const gameId = incoming?.game_id ?? null;

  // Live roster loaded from Supabase (null until loaded / when running on mock).
  const [live, setLive] = useState(null);

  useEffect(() => {
    if (!gameId || !user) return;
    let active = true;

    async function load() {
      // map auth user → integer app_user.user_id
      const { data: meRow } = await supabase
        .from('app_user').select('user_id').eq('auth_id', user.id).single();
      const myId = meRow?.user_id ?? null;

      const { data: gameRow } = await supabase
        .from('game').select('game_id, is_casual, is_active, park_id')
        .eq('game_id', gameId).single();

      const { data: players } = await supabase
        .from('game_player').select('user_id, team_side, party_id')
        .eq('game_id', gameId);

      const ids = (players ?? []).map(p => p.user_id);
      const { data: users } = ids.length
        ? await supabase.from('app_user').select('user_id, username, display_name').in('user_id', ids)
        : { data: [] };
      const nameById = Object.fromEntries(
        (users ?? []).map(u => [u.user_id, u.display_name || u.username])
      );

      const roster = (players ?? []).map(p => ({
        id: p.user_id,
        username: nameById[p.user_id] ?? `#${p.user_id}`,
        team_side: p.team_side,
        is_captain: false, // matchmaking will provide the captain flag later
      }));
      const mine = roster.find(p => p.id === myId);

      if (!active) return;
      setLive({
        casual: gameRow?.is_casual ?? false,
        park: gameRow?.park_id,
        roster,
        myId,
        mySide: mine?.team_side ?? null,
        amCaptain: !!mine?.is_captain,
      });

      // A casual game has nothing to resolve — end it as soon as details show.
      if ((gameRow?.is_casual ?? false) && gameRow?.is_active) {
        await supabase.from('game').update({ is_active: false }).eq('game_id', gameId);
      }
    }

    load();
    return () => { active = false; };
  }, [gameId, user]);

  // Build the view model from either live data or mock.
  let game;
  if (gameId) {
    if (!live) return <div className="screen gd-screen" />; // loading
    if (live.casual) {
      game = {
        mode: 'casual',
        location: live.park != null ? `PARK ${live.park}` : '',
        players: live.roster.map(p => ({ id: p.id, username: p.username, hasBall: false })),
      };
    } else {
      const side = live.mySide ?? 1;
      game = {
        mode: 'competitive',
        location: live.park != null ? `PARK ${live.park}` : '',
        time: '',
        yourTeam: live.roster.filter(p => p.team_side === side)
          .map(p => ({ id: p.id, username: p.username, isReporter: p.is_captain, hasBall: false })),
        theirTeam: live.roster.filter(p => p.team_side !== side)
          .map(p => ({ id: p.id, username: p.username, isReporter: p.is_captain, hasBall: false })),
      };
    }
  } else {
    game = incoming?.mode === 'competitive' ? MOCK_COMPETITIVE : MOCK_CASUAL;
  }

  const isCompetitive = game.mode === 'competitive';

  async function handleLeave() {
    // Real game: remove self from the live roster.
    if (gameId && live?.myId != null) {
      await supabase.from('game_player').delete()
        .eq('game_id', gameId).eq('user_id', live.myId);
    }

    if (isCompetitive) {
      const navState = { state: { game_id: gameId, mySide: live?.mySide ?? null } };
      // Captains reconcile the result; everyone else goes straight to rating.
      // In mock/dev mode (no gameId) route to PostGame so it stays reachable.
      if (!gameId || live?.amCaptain) {
        navigate('/PostGameScreen', navState);
      } else {
        navigate('/RatingScreen', navState);
      }
    } else {
      navigate('/HomeScreen'); // casual: no rating
    }
  }

  return (
    <div className="screen gd-screen">

      <h1 className="gd-title">GAME<br />DETAILS</h1>

      {isCompetitive ? (
        <div className="gd-teams">
          <div className="gd-team-block">
            <span className="gd-team-label">YOUR TEAM</span>
            <div className="gd-circles-row">
              {game.yourTeam.map(p => (
                <PlayerCircle key={p.id} isReporter={p.isReporter} hasBall={p.hasBall} mode="competitive" />
              ))}
            </div>
          </div>
          <div className="gd-team-block">
            <span className="gd-team-label">THEIR TEAM</span>
            <div className="gd-circles-row">
              {game.theirTeam.map(p => (
                <PlayerCircle key={p.id} isReporter={p.isReporter} hasBall={p.hasBall} mode="competitive" />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="gd-teams">
          <span className="gd-team-label">PLAYERS</span>
          <div className="gd-circles-grid">
            {game.players.map(p => (
              <PlayerCircle key={p.id} isReporter={false} hasBall={p.hasBall} mode="casual" />
            ))}
          </div>
        </div>
      )}

      <div className="gd-info">
        <span className="gd-location">{game.location}</span>
        {isCompetitive && game.time && <span className="gd-time">{game.time}</span>}
      </div>

      <button className="gd-leave-btn" onClick={handleLeave}>LEAVE</button>

      <div className="gd-bottom-nav">
        <button aria-label="Profile" onClick={() => navigate('/ProfileScreen')}>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </button>
      </div>

    </div>
  );
}

export default GameDetailsScreen;
