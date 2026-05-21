import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import LobbyInviteModal from '../components/LobbyInviteModal';
import ModifyGameModal from '../components/ModifyGameModal';
import './HomeScreen.css';

const DEFAULT_SETTINGS = { mode: 'competitive', format: '4V4', haveBall: false };

function HomeScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [gameSettings, setGameSettings] = useState(DEFAULT_SETTINGS);
  const [invitedPlayers, setInvitedPlayers] = useState([]);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/');
  }

  function handleInvite(friend) {
    setInvitedPlayers(prev => [...prev, friend]);
  }

  function handleSearch() {
    const lobbyPayload = {
      hostId: user.id,
      mode: gameSettings.mode,       // 'competitive' | 'casual'
      format: gameSettings.format,   // '1V1' | '2V2' | '3V3' | '4V4'
      haveBall: gameSettings.haveBall,
      partyIds: [user.id, ...invitedPlayers.map(p => p.id)],
    };
    // TODO: pass lobbyPayload to the matchmaking algorithm
    // e.g. casualAlgorithm(lobbyPayload) or competitiveAlgorithm(lobbyPayload)
    console.log('[SEARCH] lobby payload:', lobbyPayload);
  }

  const invitedIds = invitedPlayers.map(p => p.id);

  return (
    <div className="screen home-screen">
      <div className="home-content">

        <h1 className="hero-title">
          PLAY<br />NOW
        </h1>

        <div className="mode-section">
          <div className="mode-row">
            <span className="mode-label">{gameSettings.mode.toUpperCase()}</span>
            <button className="settings-btn" aria-label="Game settings" onClick={() => setShowModifyModal(true)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          </div>
          <p className="mode-sub">{gameSettings.format} BASKETBALL</p>
        </div>

        <div className="player-slots">
          {invitedPlayers.slice(0, 3).map(player => (
            <div className="slot avatar" key={player.id} title={`@${player.username}`} />
          ))}
          {Array.from({ length: Math.max(0, 3 - invitedPlayers.length) }).map((_, i) => (
            <div className="slot avatar empty" key={`empty-${i}`} aria-label="Player slot" />
          ))}
          <button
            className="slot add-slot"
            aria-label="Add player"
            onClick={() => setShowInviteModal(true)}
          >
            +
          </button>
        </div>

        <button className="search-btn" onClick={handleSearch}>SEARCH</button>

      </div>

      <div className="bottom-nav">
        <button
          className="profile-btn"
          onClick={() => navigate('/ProfileScreen')}
          aria-label="Profile"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </button>
      </div>

      {showInviteModal && (
        <LobbyInviteModal
          onClose={() => setShowInviteModal(false)}
          onInvite={handleInvite}
          invitedIds={invitedIds}
        />
      )}

      {showModifyModal && (
        <ModifyGameModal
          settings={gameSettings}
          onClose={() => setShowModifyModal(false)}
          onDone={updated => setGameSettings(updated)}
        />
      )}
    </div>
  );
}

export default HomeScreen;
