import './PlayerDot.css';

// A roster circle + name label.
//   empty   -> dim waiting slot (no name)
//   filled  -> bright white (a real player joined)
//   ball     -> purple fill (bringing the ball)
//   captain  -> red fill (team captain)
// If a player is BOTH captain and has the ball, the fill is red (captain) and a
// purple ring is drawn around it so both roles are visible.
export default function PlayerDot({ username, hasBall, isCaptain, empty }) {
  let fill = 'empty';
  if (!empty) {
    if (isCaptain) fill = 'captain';
    else if (hasBall) fill = 'ball';
    else fill = 'filled';
  }
  const ballRing = !empty && isCaptain && hasBall; // captain who also brings the ball

  return (
    <div className="player-dot-wrap">
      <div className={`player-dot player-dot--${fill} ${ballRing ? 'player-dot--ball-ring' : ''}`} />
      <span className="player-dot-name">{empty ? '' : (username || '…')}</span>
    </div>
  );
}
