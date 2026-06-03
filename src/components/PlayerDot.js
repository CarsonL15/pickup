import './PlayerDot.css';

// A roster circle + name label.
//   empty   -> dim waiting slot (no name)
//   filled  -> bright white (a real player joined)
//   ball     -> purple (bringing the ball)
//   captain  -> red (team captain)
// Captain takes precedence over ball if somehow both are set.
export default function PlayerDot({ username, hasBall, isCaptain, empty }) {
  let variant = 'empty';
  if (!empty) {
    if (isCaptain) variant = 'captain';
    else if (hasBall) variant = 'ball';
    else variant = 'filled';
  }
  return (
    <div className="player-dot-wrap">
      <div className={`player-dot player-dot--${variant}`} />
      <span className="player-dot-name">{empty ? '' : (username || '…')}</span>
    </div>
  );
}
