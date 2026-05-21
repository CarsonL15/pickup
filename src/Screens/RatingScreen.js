import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './RatingScreen.css';

// ─── Supabase integration point ───────────────────────────────────────────────
// Receives rating queue via React Router location.state from GameDetailsScreen
// once the game is completed:
//
//   navigate('/RatingScreen', { state: { queue } });
//
// Queue shape:
//   [
//     { id, username, type: 'skill' },          // teammates — rate skill
//     { id, username, type: 'sportsmanship' },  // opponents — rate sportsmanship
//   ]
//
// On completion, submit ratings to Supabase:
//   for each rated player:
//     await supabase.from('ratings')
//       .upsert({ user_id: player.id, [type]: rating, rated_by: currentUser.id });
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_QUEUE = [
  { id: '1', username: 'TOM',    type: 'skill' },
  { id: '2', username: 'SARAH',  type: 'skill' },
  { id: '3', username: 'JIM',    type: 'sportsmanship' },
  { id: '4', username: 'ALEX',   type: 'sportsmanship' },
];

const DOTS = 5;

function RatingScreen() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const queue = state?.queue ?? MOCK_QUEUE;

  const [index, setIndex]   = useState(0);
  const [selected, setSelected] = useState(0);
  const [ratings, setRatings]   = useState({});

  const current = queue[index];

  function advance(rating) {
    const next = { ...ratings };
    if (rating) next[current.id] = rating;
    setRatings(next);

    if (index < queue.length - 1) {
      setIndex(i => i + 1);
      setSelected(0);
    } else {
      // TODO: submit `next` to Supabase, then navigate back
      console.log('[RATINGS] submitted:', next);
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
