import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './GameDetailsScreen.css';

// ─── Supabase / matchmaking integration point ─────────────────────────────────
// This screen receives game data via React Router location.state, passed from
// the matchmaking algorithm once a game is found:
//
//   navigate('/GameDetailsScreen', { state: { game } });
//
// Competitive game shape:
//   {
//     mode: 'competitive',
//     location: 'COMSTOCK PARK',
//     time: '10:32',
//     yourTeam: [{ id, username, isReporter, hasBall }],
//     theirTeam: [{ id, username, isReporter, hasBall }],
//   }
//
// Casual game shape:
//   {
//     mode: 'casual',
//     location: 'COMSTOCK PARK',
//     players: [{ id, username, hasBall }],
//   }
// ─────────────────────────────────────────────────────────────────────────────

// Mock data for UI development — remove once matchmaking passes real data
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

  // Use real game data when passed from matchmaking, fall back to mock for dev
  const game = state?.game ?? MOCK_CASUAL;

  const isCompetitive = game.mode === 'competitive';

  function handleLeave() {
    // TODO: notify matchmaking that user left
    navigate('/HomeScreen');
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
        {isCompetitive && <span className="gd-time">{game.time}</span>}
      </div>

      {!isCompetitive && (
        <button className="gd-leave-btn" onClick={handleLeave}>LEAVE</button>
      )}

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
