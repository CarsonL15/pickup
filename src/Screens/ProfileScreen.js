import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import ManageFriendsModal from '../components/ManageFriendsModal';
import './ProfileScreen.css';

// ─── Supabase integration points ─────────────────────────────────────────────
// app_user columns (confirmed): user_id, username, email, display_name
// Columns to add when ready:    rank, is_online
//
// 1. Profile:
//    const { data } = await supabase
//      .from('app_user')
//      .select('username, display_name, rank')
//      .eq('user_id', user.id)
//      .single();
//
// 2. Record:
//    const { data } = await supabase
//      .from('games')
//      .select('result, played_at')
//      .eq('user_id', user.id)
//      .order('played_at', { ascending: false });
//    // shape into { wins, losses, recentGames: [{ result, played_at }] }
//
// 3. Friends:
//    const { data } = await supabase
//      .from('friends')
//      .select('friend_id, app_user!friend_id(username, is_online)')
//      .eq('user_id', user.id);
//
// 4. Ratings:
//    const { data } = await supabase
//      .from('ratings')
//      .select('skill, sportsmanship')
//      .eq('user_id', user.id)
//      .single();
//
// 5. Teams:
//    const { data } = await supabase
//      .from('team_members')
//      .select('team:teams(name, wins, losses)')
//      .eq('user_id', user.id);
// ─────────────────────────────────────────────────────────────────────────────

function ProfileScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(null);
  const [showFriendsModal, setShowFriendsModal] = useState(false);

  const [profile, setProfile] = useState(null);
  const [record, setRecord] = useState(null);
  const [friends, setFriends] = useState(null);
  const [ratings, setRatings] = useState(null);
  const [teams, setTeams] = useState(null);

  useEffect(() => {
    if (!user) return;
    // Wire up Supabase fetches here
  }, [user]);

  function toggle(section) {
    setOpen(prev => (prev === section ? null : section));
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/');
  }

  const username = profile?.username ?? user?.email?.split('@')[0] ?? '';
  const onlineFriends = friends?.filter(f => f.is_online).length ?? 0;

  return (
    <div className="screen profile-screen">

      <div className="profile-name-row">
        <h1 className="profile-name">{username.toUpperCase()}</h1>
        {profile?.rank && <span className="profile-badge">{profile.rank.toUpperCase()}</span>}
      </div>

      <div className="profile-sections">

        <div className="profile-section" onClick={() => toggle('record')}>
          <div className="profile-section-row">
            <span className="profile-section-label">RECORD</span>
            <span className="profile-section-value">
              {record ? `${record.wins}-${record.losses}` : ''}
            </span>
          </div>
          {open === 'record' && (
            <div className="profile-section-body">
              {record?.recentGames?.map((g, i) => (
                <p key={i}>{g.played_at} {g.result}</p>
              ))}
              <button className="profile-action-link" onClick={e => { e.stopPropagation(); navigate('/StatsScreen'); }}>
                ALL STATS
              </button>
            </div>
          )}
        </div>

        <div className="profile-section" onClick={() => toggle('friends')}>
          <div className="profile-section-row">
            <span className="profile-section-label">FRIENDS</span>
            <span className="profile-section-value">
              {friends ? `${onlineFriends} ONLINE` : ''}
            </span>
          </div>
          {open === 'friends' && (
            <div className="profile-section-body">
              {friends?.map(f => (
                <p key={f.id}>@{f.username}{f.is_online ? '*' : ''}</p>
              ))}
              <button className="profile-action-link" onClick={e => { e.stopPropagation(); setShowFriendsModal(true); }}>
                MANAGE
              </button>
            </div>
          )}
        </div>

        <div className="profile-section" onClick={() => toggle('ratings')}>
          <div className="profile-section-row">
            <span className="profile-section-label">RATINGS</span>
            <span className="profile-section-value">
              {ratings ? `${ratings.skill}|${ratings.sportsmanship}` : ''}
            </span>
          </div>
          {open === 'ratings' && (
            <div className="profile-section-body">
              {ratings && (
                <>
                  <p>{profile?.rank?.toUpperCase()} ({ratings.skill})</p>
                  <p>SPORTSMANSHIP: {ratings.sportsmanship}</p>
                </>
              )}
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
              {teams?.map((t, i) => (
                <p key={i}>{t.name} {t.wins}-{t.losses}</p>
              ))}
              <button className="profile-action-link" onClick={e => { e.stopPropagation(); navigate('/TeamsScreen'); }}>
                MANAGE
              </button>
            </div>
          )}
        </div>

      </div>

      <button className="profile-logout" onClick={handleLogout}>LOGOUT</button>

      {showFriendsModal && (
        <ManageFriendsModal onClose={() => setShowFriendsModal(false)} />
      )}

      <div className="profile-bottom-nav">
        <button aria-label="Home" onClick={() => navigate('/HomeScreen')}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </button>
        <button aria-label="Profile">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </button>
      </div>

    </div>
  );
}

export default ProfileScreen;
