import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import PlayerDot from '../components/PlayerDot';
import './FindingGameScreen.css';
import GameChat from '../components/GameChat';

// ─── Finding Game (matchmaking lobby) ──────────────────────────────────────────
// Two-stage realtime discovery:
//   1. watch for MY game_player row to appear (filtered by my user_id) -> learn game_id
//   2. watch THAT game's roster fill (re-fetch on any game_player change, so we keep
//      usernames joined) and its is_active flip -> transition to GameDetails.
// Navigation state from SEARCH: { mode, numVs, haveBall }.
// ───────────────────────────────────────────────────────────────────────────────

function FindingGameScreen() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const mode = state?.mode ?? 'casual';
  const numVs = state?.numVs ?? 4;
  const maxPlayers = numVs > 0 ? numVs * 2 : null; // total slots; null when "any"

  const [gameId, setGameId] = useState(null);
  const [players, setPlayers] = useState([]); // { user_id, team_side, username, is_captain }
  const [parkName, setParkName] = useState('');
  const [showGameChat, setShowGameChat] = useState(false);

  // ── Stage 1: discover my game ──
  // "Have ball" is captured by the lobby toggle only (no DB column, no dot), so
  // there's nothing to persist here.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    let channel;

    (async () => {
      const { data: appUser } = await supabase
        .from('app_user').select('user_id').eq('auth_id', user.id).maybeSingle();
      if (!appUser || cancelled) return;
      const uid = appUser.user_id;

      const { data: existing } = await supabase
        .from('game_player').select('game_id').eq('user_id', uid).maybeSingle();
      if (existing && !cancelled) {
        setGameId(existing.game_id);
        return;
      }

      channel = supabase
        .channel(`find-me-${uid}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'game_player', filter: `user_id=eq.${uid}` },
          (payload) => {
            if (cancelled) return;
            setGameId(payload.new.game_id);
          }
        )
        .subscribe();
    })();

    return () => { cancelled = true; if (channel) supabase.removeChannel(channel); };
  }, [user?.id]);

  // ── Stage 2: watch my game's roster (with usernames) + readiness ──
  useEffect(() => {
    if (gameId == null) return;
    let cancelled = false;

    const goToDetails = () =>
      navigate('/GameDetailsScreen', { state: { gameId, mode }, replace: true });

    async function loadRoster() {
      const { data } = await supabase
        .from('game_player')
        .select('user_id, team_side, is_captain, app_user(username)')
        .eq('game_id', gameId);
      if (cancelled || !data) return;
      setPlayers(data.map((r) => ({
        user_id: r.user_id,
        team_side: r.team_side,
        is_captain: r.is_captain,
        username: r.app_user?.username ?? null,
      })));
    }

    async function loadMeta() {
      const { data: game } = await supabase
        .from('game').select('is_active, park_id').eq('game_id', gameId).maybeSingle();
      if (cancelled || !game) return;
      if (game.park_id != null) {
        const { data: park } = await supabase
          .from('parks').select('park_name').eq('park_id', game.park_id).maybeSingle();
        if (!cancelled && park) setParkName(park.park_name);
      }
      if (game.is_active) goToDetails();
    }

    loadRoster();
    loadMeta();

    const channel = supabase
      .channel(`find-game-${gameId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'game_player', filter: `game_id=eq.${gameId}` },
        () => loadRoster()
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'game', filter: `game_id=eq.${gameId}` },
        (payload) => { if (payload.new.is_active) goToDetails(); }
      )
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [gameId, mode, navigate]);

  // eslint-disable-next-line no-unused-vars -- CANCEL button removed; logic kept for future re-add
  async function handleCancel() {
    if (user) {
      const { data: appUser } = await supabase
        .from('app_user').select('user_id').eq('auth_id', user.id).maybeSingle();
      if (appUser) {
        await supabase.from('queue_entry').delete().eq('player_id', appUser.user_id);
        await supabase.from('game_player').delete().eq('user_id', appUser.user_id);
      }
    }
    navigate('/HomeScreen');
  }

  const emptyCount = maxPlayers != null ? Math.max(0, maxPlayers - players.length) : 0;

  return (
    <div className="screen fg-screen">
      <h1 className="fg-title">
        FINDING<br />GAME<span className="fg-title-dots" aria-hidden="true"><span>.</span><span>.</span><span>.</span></span>
      </h1>

      <div className="fg-meta">
        <span className="fg-mode">{mode === 'competitive' ? 'COMPETITIVE' : 'CASUAL'}</span>
        <span className="fg-sport">BASKETBALL</span>
        {parkName && <span className="fg-park">{parkName}</span>}
      </div>

      <div className="fg-players">
        <span className="fg-players-label">PLAYERS</span>
        <div className="fg-dots">
          {players.map((p) => (
            <PlayerDot key={p.user_id} username={p.username} isCaptain={p.is_captain} />
          ))}
          {Array.from({ length: emptyCount }).map((_, i) => (
            <PlayerDot key={`empty-${i}`} empty />
          ))}
        </div>
      </div>

      <div className="fg-actions">
        <button className="fg-action-btn" onClick={() => { setShowGameChat(true); }}>CHAT</button>

        {showGameChat && (
            <GameChat
          user={user}
          game_id={gameId}
          onClose={() => setShowGameChat(false)}
        />
)}
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