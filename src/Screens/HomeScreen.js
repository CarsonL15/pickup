import { useState } from 'react';
import './HomeScreen.css';

// Placeholder friends list — will come from backend later
const FRIENDS = [
  { id: 1, username: 'warren', invited: false },
  { id: 2, username: 'jake',   invited: false },
  { id: 3, username: 'nicolle',invited: false },
  { id: 4, username: 'carson', invited: true  },
];

const GAME_SIZES = ['1V1', '2V2', '3V3', '4V4', '5V5'];
const LOCKED_SIZES = ['5V5']; // not yet available

function HomeScreen() {
  // which modal is open: null | 'invite' | 'modify'
  const [modal, setModal] = useState(null);

  // lobby slots — up to 4 players (index 0 = you, always filled)
  const [lobbySlots] = useState([true, false, false]); // you + 2 friends shown; 4th slot is you

  // modify-game state
  const [gameMode, setGameMode] = useState('COMPETITIVE'); // 'COMPETITIVE' | 'CASUAL'
  const [gameSize, setGameSize] = useState('4V4');
  const [hasBall, setHasBall]   = useState(false);

  // invite state
  const [friends, setFriends] = useState(FRIENDS);
  const [friendSearch, setFriendSearch] = useState('');

  function toggleInvite(id) {
    setFriends(prev =>
      prev.map(f => f.id === id ? { ...f, invited: !f.invited } : f)
    );
  }

  const filteredFriends = friends.filter(f =>
    f.username.toLowerCase().includes(friendSearch.toLowerCase())
  );

  return (
    <div className="screen home-screen">

      {/* ── Hero headline ───────────────────────────────────── */}
      <h1 className="text-hero home-hero">PLAY<br />NOW</h1>

      {/* ── Spacer pushes bottom content down ───────────────── */}
      <div style={{ flex: 1 }} />

      {/* ── Game type row ────────────────────────────────────── */}
      <div
        className="home-game-type"
        onClick={() => setModal('modify')}
        role="button"
        tabIndex={0}
        aria-label="Modify game settings"
      >
        <div className="home-game-type-top">
          <span className="text-accent">{gameMode}</span>
          <span className="home-settings-icon">⚙</span>
        </div>
        <span className="home-game-subtitle">{gameSize} BASKETBALL</span>
      </div>

      {/* ── Lobby slots ──────────────────────────────────────── */}
      <div className="home-lobby-row">
        {lobbySlots.map((filled, i) => (
          <div key={i} className={`home-avatar ${filled ? 'home-avatar--filled' : ''}`} />
        ))}
        <button
          className="home-add-btn"
          onClick={() => setModal('invite')}
          aria-label="Invite friends"
        >
          +
        </button>
      </div>

      {/* ── Search button ────────────────────────────────────── */}
      <button className="btn btn-primary home-search-btn">SEARCH</button>

      {/* ── Profile icon ─────────────────────────────────────── */}
      <button className="home-profile-btn" aria-label="Profile">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        </svg>
      </button>

      {/* ── Overlay ──────────────────────────────────────────── */}
      {modal && (
        <div className="home-overlay" onClick={() => setModal(null)} />
      )}

      {/* ── Lobby Invite modal ───────────────────────────────── */}
      {modal === 'invite' && (
        <div className="home-modal">
          <div className="home-modal-header">
            <span className="home-modal-search-icon">🔍</span>
            <input
              className="home-modal-search"
              placeholder="search friends…"
              value={friendSearch}
              onChange={e => setFriendSearch(e.target.value)}
              autoFocus
            />
            <button className="home-modal-close" onClick={() => setModal(null)}>✕</button>
          </div>

          <ul className="home-friend-list">
            {filteredFriends.map(f => (
              <li key={f.id} className="home-friend-row">
                <span className="home-friend-name">@{f.username}</span>
                <button
                  className={`home-invite-btn ${f.invited ? 'home-invite-btn--invited' : ''}`}
                  onClick={() => toggleInvite(f.id)}
                >
                  {f.invited ? 'INVITED' : 'INVITE'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Modify Game modal ────────────────────────────────── */}
      {modal === 'modify' && (
        <div className="home-modal">
          <div className="home-modal-header">
            <span className="home-modal-title">BASKETBALL</span>
            <span className="home-modal-menu">≡</span>
          </div>

          {/* Competitive / Casual toggle */}
          <div className="home-mode-row">
            {['COMPETITIVE', 'CASUAL'].map(m => (
              <button
                key={m}
                className={`home-mode-btn ${gameMode === m ? 'home-mode-btn--active' : ''}`}
                onClick={() => setGameMode(m)}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Game size selector */}
          <div className="home-size-row">
            {GAME_SIZES.map(s => {
              const locked = LOCKED_SIZES.includes(s);
              return (
                <button
                  key={s}
                  className={`home-size-btn
                    ${gameSize === s ? 'home-size-btn--active' : ''}
                    ${locked ? 'home-size-btn--locked' : ''}`}
                  onClick={() => !locked && setGameSize(s)}
                  disabled={locked}
                >
                  {s}
                </button>
              );
            })}
          </div>

          {/* Have ball + Done */}
          <div className="home-modal-footer">
            <div className="home-ball-row">
              <span>HAVE BALL</span>
              <button
                className={`home-checkbox ${hasBall ? 'home-checkbox--checked' : ''}`}
                onClick={() => setHasBall(prev => !prev)}
              >
                {hasBall ? '✓' : '✕'}
              </button>
            </div>
            <button
              className="home-done-btn"
              onClick={() => setModal(null)}
            >
              DONE
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default HomeScreen;
