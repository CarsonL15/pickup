import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './PostGameScreen.css';

// ─── Captain win/loss reporting ───────────────────────────────────────────────
// Reached from GameDetailsScreen (captains only) with:
//
//   navigate('/PostGameScreen', { state: { gameId, mySide } });
//
// The captain reports whether THEIR team won; the `report_game_result` RPC
// normalizes it to game.team1_wins and reconciles the two captains:
//   'recorded'        – first captain reported, waiting on the other
//   'finalized'       – both agreed; history.won set, game deleted
//   'conflict'        – the captains disagree; re-report (-2 sportsmanship to the reporter)
//   'ended_no_result' – disagreed more than twice; game ended with no result
//
// Without a game_id (dev/mock) it just forwards to the rating flow.
// ─────────────────────────────────────────────────────────────────────────────

function PostGameScreen() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const gameId = state?.gameId ?? null;
  const mySide = state?.mySide ?? null;
  const usingMock = gameId == null;

  const [phase, setPhase] = useState('choose'); // choose | waiting | conflict | ended
  const [submitting, setSubmitting] = useState(false);

  function goRate() {
    navigate('/RatingScreen', { state: { gameId, mySide } });
  }

  // While this captain waits, the other captain's confirmation (finalize) — or a
  // force-end after repeated disputes — deletes the game row. Watch for that and
  // auto-advance to ratings; otherwise the first reporter is stuck on "waiting"
  // forever once the other one selects.
  useEffect(() => {
    if (phase !== 'waiting' || usingMock || gameId == null) return;
    let done = false;
    const advance = () => {
      if (done) return;
      done = true;
      navigate('/RatingScreen', { state: { gameId, mySide } });
    };

    // Guard the race where finalize happened before this subscription attached.
    (async () => {
      const { data } = await supabase
        .from('game').select('game_id').eq('game_id', gameId).maybeSingle();
      if (!data) advance();
    })();

    const channel = supabase
      .channel(`postgame-${gameId}`)
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'game', filter: `game_id=eq.${gameId}` },
        advance
      )
      .subscribe();

    return () => { done = true; supabase.removeChannel(channel); };
  }, [phase, usingMock, gameId, mySide, navigate]);

  async function handleResult(result) {
    if (submitting) return;
    setSubmitting(true);

    if (usingMock) {
      goRate();
      return;
    }

    const { data: status, error } = await supabase.rpc('report_game_result', {
      p_game_id: gameId,
      p_team_won: result === 'win',
    });
    setSubmitting(false);

    if (error) {
      console.error('[PostGame] report_game_result failed:', error);
      return;
    }

    if (status === 'finalized') goRate();
    else if (status === 'recorded') setPhase('waiting');
    else if (status === 'conflict') setPhase('conflict');
    else if (status === 'ended_no_result') setPhase('ended');
  }

  // Result recorded — this captain is done; the other still has to confirm.
  if (phase === 'waiting') {
    return (
      <div className="screen pg-screen">
        <h1 className="pg-title">POST<br />GAME</h1>
        <div className="pg-options">
          <span className="pg-status">RESULT RECORDED</span>
          <p className="pg-message">Waiting for the other captain to confirm.</p>
        </div>
        <button className="pg-continue" onClick={goRate}>CONTINUE TO RATINGS</button>
      </div>
    );
  }

  // Force-ended after disagreeing more than twice.
  if (phase === 'ended') {
    return (
      <div className="screen pg-screen">
        <h1 className="pg-title">NO<br />RESULT</h1>
        <div className="pg-options">
          <p className="pg-message">
            The captains couldn't agree — the game ended with no result.
          </p>
        </div>
        <button className="pg-continue" onClick={goRate}>CONTINUE TO RATINGS</button>
      </div>
    );
  }

  const inConflict = phase === 'conflict';

  return (
    <div className="screen pg-screen">

      <h1 className="pg-title">POST<br />GAME</h1>

      {inConflict && (
        <p className="pg-warning">
          You and the other captain disagree. Reporting a conflicting result
          costs you sportsmanship.
        </p>
      )}

      <div className="pg-options">
        <button className="pg-option" onClick={() => handleResult('win')} disabled={submitting}>WIN</button>
        <div className="pg-divider" />
        <button className="pg-option" onClick={() => handleResult('loss')} disabled={submitting}>LOSS</button>
      </div>

    </div>
  );
}

export default PostGameScreen;
