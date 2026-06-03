import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import ManageFriendsModal from '../components/ManageFriendsModal';
import ManageTeamsModal from '../components/ManageTeamsModal';
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
//      .from('friendship')
//      .select('friend_id, app_user!friend_id(username, is_online)')
//      .eq('user_id', user.id);
//
// 4. Ratings:
//    const { data } = await supabase
//      .from('ratings')
//      .select('skill, sportsmanship, rank, next_rank, games_to_next')
//      .eq('user_id', user.id)
//      .single();
//
// 5. Teams:
//    const { data } = await supabase
//      .from('team_members')
//      .select('team:teams(id, name, wins, losses)')
//      .eq('user_id', user.id);
// ─────────────────────────────────────────────────────────────────────────────

// timestamp -> "M/D"
function formatMD(ts) {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function ProfileScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(null);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [showTeamsModal, setShowTeamsModal] = useState(false);

  const [profile, setProfile] = useState(null);
  const [record, setRecord] = useState(null);
  const [friends, setFriends] = useState(null);
  const [ratings, setRatings] = useState(null);
  const [teams, setTeams] = useState(null);
  const channelRef = useRef(null);

  async function loadFriends(uid) {
    const { data: rows } = await supabase
      .from('friendship')
      .select('friendship_id, requester_id, receiver_id, requester:app_user!friendship_requester_id_fkey(user_id, username), receiver:app_user!friendship_receiver_id_fkey(user_id, username)')
      .or(`requester_id.eq.${uid},receiver_id.eq.${uid}`)
      .eq('status', 'accepted');
    if (!rows) return;
    setFriends(rows.map(r => {
      const friend = r.requester_id === uid ? r.receiver : r.requester;
      return { id: r.friendship_id, username: friend?.username };
    }));
  }

  // win/loss record + ratings from user_stats, recent games from game_history_player
  async function loadStats(uid) {
    const { data: stats } = await supabase
      .from('user_stats').select('skill, sportsmanship, wins, losses').eq('user_id', uid).maybeSingle();

    const { data: games } = await supabase
      .from('game_history_player').select('won, day')
      .eq('user_id', uid).not('won', 'is', null)
      .order('day', { ascending: false }).limit(5);

    const recentGames = (games ?? []).map(g => ({
      result: g.won ? 'WIN' : 'LOSS',
      played_at: g.day ? formatMD(g.day) : '',
    }));

    setRecord({ wins: stats?.wins ?? 0, losses: stats?.losses ?? 0, recentGames });
    setRatings({ skill: stats?.skill ?? 0, sportsmanship: stats?.sportsmanship ?? 0 });
  }

  useEffect(() => {
    if (!user) return;
    supabase
      .from('app_user')
      .select('username, display_name, user_id')
      .eq('auth_id', user.id)
      .single()
      .then(({ data }) => {
        if (!data) return;
        setProfile(data);
        loadFriends(data.user_id);
        loadStats(data.user_id);

        if (channelRef.current) supabase.removeChannel(channelRef.current);
        channelRef.current = supabase
          .channel(`friendship-${data.user_id}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'friendship' }, () => {
            loadFriends(data.user_id);
          })
          .subscribe();
      });

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [user?.id]);

  function toggle(section) {
    setOpen(prev => (prev === section ? null : section));
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/');
  }

  const username = profile?.display_name || profile?.username || user?.email?.split('@')[0] || '';
  const onlineFriends = friends?.filter(f => f.is_online).length ?? 0;

  return (
    <div className="screen profile-screen">

      <div className="profile-name-row">
        <h1 className="profile-name">{username.toUpperCase()}</h1>
        {profile?.rank && <span className="profile-badge">{profile.rank.toUpperCase()}</span>}
      </div>

      <div className="profile-sections">

        {/* RECORD */}
        <div className="profile-section" onClick={() => toggle('record')}>
          <div className="profile-section-row">
            <span className="profile-section-label">RECORD</span>
            <span className="profile-section-value">
              {record ? `${record.wins}-${record.losses}` : ''}
            </span>
          </div>
          {open === 'record' && (
            <div className="profile-section-body">
              {record?.recentGames?.length ? record.recentGames.map((g, i) => (
                <div className="profile-game-row" key={i}>
                  <span className="profile-game-date">{g.played_at}</span>
                  <span className={`profile-game-result ${g.result === 'WIN' ? 'win' : 'loss'}`}>
                    {g.result}
                  </span>
                </div>
              )) : (
                <span className="profile-game-date">No games yet</span>
              )}
            </div>
          )}
        </div>

        {/* FRIENDS */}
        <div className="profile-section" onClick={() => toggle('friends')}>
          <div className="profile-section-row">
            <span className="profile-section-label">FRIENDS</span>
          </div>
          {open === 'friends' && (
            <div className="profile-section-body">
              {friends && friends.length === 0 && (
                <span className="profile-friend-name">No friends yet</span>
              )}
              {friends?.slice(0, 4).map(f => (
                <span key={f.id} className="profile-friend-name">@{f.username}</span>
              ))}
              <button className="profile-action-link" onClick={e => { e.stopPropagation(); setShowFriendsModal(true); }}>
                MANAGE
              </button>
            </div>
          )}
        </div>

        {/* RATINGS */}
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
                  <span className="profile-rating-rank">SKILL: {ratings.skill}</span>
                  <span className="profile-rating-sport">SPORTSMANSHIP: {ratings.sportsmanship}</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* TEAMS */}
        <div className="profile-section profile-section--last" onClick={() => toggle('teams')}>
          <div className="profile-section-row">
            <span className="profile-section-label">TEAMS</span>
            <span className="profile-section-value"></span>
          </div>
          {open === 'teams' && (
            <div className="profile-section-body">
              {teams?.map((t, i) => (
                <span key={i} className="profile-team-name">
                  {t.name.toUpperCase()} {t.wins}-{t.losses}
                </span>
              ))}
              <button className="profile-action-link" onClick={e => { e.stopPropagation(); setShowTeamsModal(true); }}>
                MANAGE
              </button>
            </div>
          )}
        </div>

      </div>

      <button className="profile-logout" onClick={handleLogout}>LOGOUT</button>

      {showFriendsModal && (
        <ManageFriendsModal onClose={() => setShowFriendsModal(false)} myUserId={profile?.user_id} onFriendsChange={() => loadFriends(profile?.user_id)} />
      )}

      {showTeamsModal && (
        <ManageTeamsModal onClose={() => setShowTeamsModal(false)} />
      )}

      <div className="profile-bottom-nav">
        <button aria-label="Home" onClick={() => navigate('/HomeScreen')}>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </button>
        <button aria-label="Profile">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </button>
      </div>

    </div>
  );
}

export default ProfileScreen;
