import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import './ProfileScreen.css';

function ProfileScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(null);

  const username = (
    user?.user_metadata?.username ??
    user?.email?.split('@')[0] ??
    'Player'
  ).toUpperCase();

  function toggle(section) {
    setOpen(prev => (prev === section ? null : section));
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/');
  }

  return (
    <div className="screen profile-screen">

      <div className="profile-name-row">
        <h1 className="profile-name">{username}</h1>
        <span className="profile-badge">PRO</span>
      </div>

      <div className="profile-sections">

        <div className="profile-section" onClick={() => toggle('record')}>
          <div className="profile-section-row">
            <span className="profile-section-label">RECORD</span>
            <span className="profile-section-value">98-1</span>
          </div>
          {open === 'record' && (
            <div className="profile-section-body">
              <p>2/15 WIN</p>
              <p>2/12 WIN</p>
              <p>2/10 LOSS</p>
              <button className="profile-action-link" onClick={e => { e.stopPropagation(); navigate('/StatsScreen'); }}>
                ALL STATS
              </button>
            </div>
          )}
        </div>

        <div className="profile-section" onClick={() => toggle('friends')}>
          <div className="profile-section-row">
            <span className="profile-section-label">FRIENDS</span>
            <span className="profile-section-value">1 ONLINE</span>
          </div>
          {open === 'friends' && (
            <div className="profile-section-body">
              <p>@warren*</p>
              <p>@jake</p>
              <p>@nicolle</p>
              <p>@carson</p>
              <button className="profile-action-link" onClick={e => { e.stopPropagation(); navigate('/FriendsScreen'); }}>
                MANAGE
              </button>
            </div>
          )}
        </div>

        <div className="profile-section" onClick={() => toggle('ratings')}>
          <div className="profile-section-row">
            <span className="profile-section-label">RATINGS</span>
            <span className="profile-section-value">122|83</span>
          </div>
          {open === 'ratings' && (
            <div className="profile-section-body">
              <p>PRO (122) &#8594; 24 TO EXPERT</p>
              <p>SPORTSMANSHIP: 83</p>
              <button className="profile-action-link" onClick={e => e.stopPropagation()}>
                FAQ
              </button>
            </div>
          )}
        </div>

        <div className="profile-section" onClick={() => toggle('teams')}>
          <div className="profile-section-row">
            <span className="profile-section-label">TEAMS</span>
            <span className="profile-section-value"></span>
          </div>
          {open === 'teams' && (
            <div className="profile-section-body">
              <p>TONY&#39;S INTERNS 2-10</p>
              <button className="profile-action-link" onClick={e => { e.stopPropagation(); navigate('/TeamsScreen'); }}>
                MANAGE
              </button>
            </div>
          )}
        </div>

      </div>

      <button className="profile-logout" onClick={handleLogout}>LOGOUT</button>

      <div className="profile-bottom-nav">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </div>

    </div>
  );
}

export default ProfileScreen;
