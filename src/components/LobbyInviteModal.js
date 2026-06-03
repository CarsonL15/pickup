import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import './LobbyInviteModal.css';

function LobbyInviteModal({ onClose, onInvite, invitedIds = [] }) {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchFriends() {
      setLoading(true);

      const { data: appUser } = await supabase
        .from('app_user')
        .select('user_id')
        .eq('auth_id', user.id)
        .single();

      if (!appUser) { setLoading(false); return; }

      const { data } = await supabase
        .from('friendship')
        .select('requester_id, receiver_id, requester:app_user!friendship_requester_id_fkey(user_id, username), receiver:app_user!friendship_receiver_id_fkey(user_id, username)')
        .or(`requester_id.eq.${appUser.user_id},receiver_id.eq.${appUser.user_id}`)
        .eq('status', 'accepted');

      if (data) {
        setFriends(data.map(r => {
          const friend = r.requester_id === appUser.user_id ? r.receiver : r.requester;
          return { id: friend?.user_id, username: friend?.username };
        }));
      }

      setLoading(false);
    }

    fetchFriends();
  }, [user?.id]);

  const filtered = friends.filter(f =>
    f.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>

        <div className="modal-header">
          <div className="search-row">
            <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className="search-input"
              type="text"
              placeholder="Search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close">X</button>
        </div>

        <div className="friends-list">
          {loading && <p className="modal-empty">Loading...</p>}
          {!loading && filtered.length === 0 && (
            <p className="modal-empty">No friends found</p>
          )}
          {!loading && filtered.map(friend => {
            const invited = invitedIds.includes(friend.id);
            return (
              <div className="friend-row" key={friend.id}>
                <span className="friend-name">@{friend.username}</span>
                <button
                  className={`invite-btn ${invited ? 'invited' : ''}`}
                  onClick={() => !invited && onInvite(friend)}
                  disabled={invited}
                >
                  {invited ? 'INVITED' : 'INVITE'}
                </button>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}

export default LobbyInviteModal;
