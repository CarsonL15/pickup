import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import './RatingScreen.css';

// ─── Post-game ratings (competitive only) ─────────────────────────────────────
// Reached from GameDetailsScreen / PostGameScreen with:
//
//   navigate('/RatingScreen', { state: { gameId, mySide } });
//
// Each player rates the OTHER team's sportsmanship, then YOUR team's skill (both
// skippable), via rate_player → adjusts the target's user_stats column by
// (rating - 3): 1→-2, 3→0, 5→+2. SKIP submits nothing.
//
// Skill is ALSO adjusted automatically at game finalize from the team skill
// differential (see report_game_result); these peer ratings stack on top of that.
//
// Without a game_id (dev/mock) it runs on mock data and submits nothing.
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_QUEUE = [
  { id: '3', username: 'JIM',   type: 'sportsmanship' },
  { id: '4', username: 'ALEX',  type: 'sportsmanship' },
  { id: '1', username: 'TOM',   type: 'skill' },
  { id: '2', username: 'SARAH', type: 'skill' },
];

const DOTS = 5;

function RatingScreen() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const gameId = state?.gameId ?? null;
  const usingMock = gameId == null;

  const [queue, setQueue] = useState(usingMock ? MOCK_QUEUE : null);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(0);

  // Load the rating queue from the persistent history roster.
  useEffect(() => {
    if (usingMock || !user) return;
    let active = true;

    async function load() {
      const { data: meRow } = await supabase
        .from('app_user').select('user_id').eq('auth_id', user.id).single();
      const myId = meRow?.user_id ?? null;

      const { data: rows } = await supabase
        .from('game_history_player').select('user_id, team_side')
        .eq('game_id', gameId);

      const mine = (rows ?? []).find(r => r.user_id === myId);
      const mySide = state?.mySide ?? mine?.team_side ?? null;

      const others = (rows ?? []).filter(r => r.user_id !== myId);
      const ids = others.map(r => r.user_id);
      const { data: users } = ids.length
        ? await supabase.from('app_user').select('user_id, username, display_name').in('user_id', ids)
        : { data: [] };
      const nameById = Object.fromEntries(
        (users ?? []).map(u => [u.user_id, u.display_name || u.username])
      );

      // opponents first (rate sportsmanship), then teammates (rate skill)
      const opponents = others.filter(r => r.team_side !== mySide)
        .map(r => ({ id: r.user_id, username: nameById[r.user_id] ?? `#${r.user_id}`, type: 'sportsmanship' }));
      const teammates = others.filter(r => r.team_side === mySide)
        .map(r => ({ id: r.user_id, username: nameById[r.user_id] ?? `#${r.user_id}`, type: 'skill' }));

      if (!active) return;
      setQueue([...opponents, ...teammates]);
    }

    load();
    return () => { active = false; };
  }, [gameId, usingMock, user, state]);

  // Nothing to rate (e.g. solo game) — bounce home.
  useEffect(() => {
    if (queue && queue.length === 0) navigate('/HomeScreen');
  }, [queue, navigate]);

  if (!queue || queue.length === 0) return <div className="screen rating-screen" />; // loading / empty

  const current = queue[index];

  async function advance(rating) {
    if (rating && !usingMock) {
      const { error } = await supabase.rpc('rate_player', {
        p_game_id: gameId,
        p_target_user: current.id,
        p_kind: current.type,
        p_rating: rating,
      });
      if (error) console.error('[Rating] rate_player failed:', error);
    }

    if (index < queue.length - 1) {
      setIndex(i => i + 1);
      setSelected(0);
    } else {
      navigate('/HomeScreen');
    }
  }

  function handleDot(dot) {
    setSelected(dot);
    setTimeout(() => advance(dot), 300);
  }

  function handleSkip() {
    advance(null);
  }

  const isSkill = current.type === 'skill';

  return (
    <div className="screen rating-screen">

      <div className="rating-header">
        <h1 className="rating-title">RATE</h1>
        <p className="rating-subtitle">{isSkill ? 'SKILL LEVEL' : 'SPORTSMANSHIP'}</p>
      </div>

      <div className="rating-avatar">
        <span className="rating-avatar-name">{current.username}</span>
      </div>

      <div className="rating-dots">
        {Array.from({ length: DOTS }).map((_, i) => {
          const dot = i + 1;
          return (
            <button
              key={dot}
              className={`rating-dot ${selected >= dot ? 'active' : ''}`}
              onClick={() => handleDot(dot)}
              aria-label={`Rate ${dot} out of ${DOTS}`}
            />
          );
        })}
      </div>

      <button className="rating-skip" onClick={handleSkip}>SKIP</button>

    </div>
  );
}

export default RatingScreen;
