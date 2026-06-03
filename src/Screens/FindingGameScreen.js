import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import './FindingGameScreen.css';

// ─── Finding Game (matchmaking lobby) ──────────────────────────────────────────
// Reached after the user hits SEARCH and a queue_entry row is inserted. The Python
// matchmaker (separate process) places the user into game_player + creates the game
// asynchronously, so this screen discovers its game in two stages:
//   1. watch for MY game_player row to appear (filtered by my user_id) -> learn game_id
//   2. watch THAT game's roster fill (game_player INSERT/DELETE) and its is_active flip
// When is_active flips true, the game is full -> everyone transitions to GameDetails.
//
// Navigation state expected from the SEARCH screen:
//   { mode: 'casual' | 'competitive', numVs: 2 | 3 | 4 }   // numVs sizes the dot grid
// ───────────────────────────────────────────────────────────────────────────────

function FindingGameScreen() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const mode = state?.mode ?? 'casual';
  const numVs = state?.numVs ?? 4;
  const haveBall = state?.haveBall ?? false;
  const maxPlayers = numVs > 0 ? numVs * 2 : null; // total slots; null when "any"

  const [gameId, setGameId] = useState(null);
  const [players, setPlayers] = useState([]); // game_player rows for my game
  const [parkName, setParkName] = useState('');

  // ── Stage 1: discover my game ──
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    let channel;

    (async () => {
      // auth uuid -> integer app_user.user_id
      const { data: appUser } = await supabase
        .from('app_user').select('user_id').eq('auth_id', user.id).maybeSingle();
      if (!appUser || cancelled) return;
      const myUserId = appUser.user_id;

      // record my "bringing the ball" choice on my own game_player row (RLS: own row)
      const markBall = () =>
        supabase.from('game_player').update({ has_ball: haveBall }).eq('user_id', myUserId);

      // the matchmaker may have already placed me
      const { data: existing } = await supabase
        .from('game_player').select('game_id').eq('user_id', myUserId).maybeSingle();
      if (existing && !cancelled) {
        await markBall();
        setGameId(existing.game_id);
        return;
      }

      // otherwise wait for my row to be inserted
      channel = supabase
        .channel(`find-me-${myUserId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'game_player', filter: `user_id=eq.${myUserId}` },
          (payload) => {
            if (cancelled) return;
            markBall();
            setGameId(payload.new.game_id);
          }
        )
        .subscribe();
    })();

    return () => { cancelled = true; if (channel) supabase.removeChannel(channel); };
  }, [user]);

  // ── Stage 2: watch my game's roster + readiness ──
  useEffect(() => {
    if (gameId == null) return;
    let cancelled = false;

    const goToDetails = () =>
      navigate('/GameDetailsScreen', { state: { gameId, mode }, replace: true });

    (async () => {
      const { data: roster } = await supabase
        .from('game_player').select('user_id, team_side').eq('game_id', gameId);
      if (!cancelled && roster) setPlayers(roster);

      const { data: game } = await supabase
        .from('game').select('is_active, park_id').eq('game_id', gameId).single();
      if (cancelled || !game) return;

      if (game.park_id != null) {
        const { data: park } = await supabase
          .from('parks').select('park_name').eq('park_id', game.park_id).maybeSingle();
        if (!cancelled && park) setParkName(park.park_name);
      }
      if (game.is_active) goToDetails(); // already full by the time we loaded
    })();

    const channel = supabase
      .channel(`find-game-${gameId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'game_player', filter: `game_id=eq.${gameId}` },
        (payload) => setPlayers((prev) =>
          prev.some((p) => p.user_id === payload.new.user_id) ? prev : [...prev, payload.new])
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'game_player', filter: `game_id=eq.${gameId}` },
        (payload) => setPlayers((prev) => prev.filter((p) => p.user_id !== payload.old.user_id))
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'game', filter: `game_id=eq.${gameId}` },
        (payload) => { if (payload.new.is_active) goToDetails(); }
      )
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [gameId]);

  async function handleCancel() {
    if (user) {
      const { data: appUser } = await supabase
        .from('app_user').select('user_id').eq('auth_id', user.id).maybeSingle();
      if (appUser) {
        // remove from the queue if still waiting, and from a game if already placed
        await supabase.from('queue_entry').delete().eq('player_id', appUser.user_id);
        await supabase.from('game_player').delete().eq('user_id', appUser.user_id);
      }
    }
    navigate('/HomeScreen');
  }

  const filled = players.length;
  const total = maxPlayers ?? filled;
  const slots = Array.from({ length: total }, (_, i) => i < filled);

  return (
    <div className="screen fg-screen">
      <h1 className="fg-title">FINDING<br />GAME</h1>

      <div className="fg-meta">
        <span className="fg-mode">{mode === 'competitive' ? 'COMPETITIVE' : 'CASUAL'}</span>
        <span className="fg-sport">BASKETBALL</span>
        {parkName && <span className="fg-park">{parkName}</span>}
      </div>

      <div className="fg-players">
        <span className="fg-players-label">PLAYERS</span>
        <div className="fg-dots">
          {slots.map((isFilled, i) => (
            <div key={i} className={`fg-dot ${isFilled ? 'filled' : ''}`} />
          ))}
        </div>
      </div>

      <div className="fg-actions">
        <button className="fg-action-btn" onClick={handleCancel}>CANCEL</button>
        <button className="fg-action-btn" onClick={() => { /* TODO: game chat */ }}>CHAT</button>
      </div>

      <div className="fg-bottom-nav">
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

export default FindingGameScreen;
