import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import './LobbyInviteModal.css';

// ─── Supabase integration point ──────────────────────────────────────────────
// Replace MOCK_FRIENDS with a real fetch once you have DB access:
//
//   const { data, error } = await supabase
//     .from('friends')
//     .select('friend_id, app_user!friend_id(username)')
//     .eq('user_id', user.id);
//
// Expected shape: [{ id, username }]
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_FRIENDS = [
  { id: '1', username: 'warren' },
  { id: '2', username: 'jake' },
  { id: '3', username: 'nicolle' },
  { id: '4', username: 'carson' },
];

function LobbyInviteModal({ onClose, onInvite, invitedIds = [] }) {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFriends() {
      setLoading(true);

      // ── Swap this block for the real Supabase query when ready ──
      // const { data, error } = await supabase
      //   .from('friends')
      //   .select('friend_id, app_user!friend_id(username)')
      //   .eq('user_id', user.id);
      // if (!error) setFriends(data.map(r => ({ id: r.friend_id, username: r.app_user.username })));
      // ────────────────────────────────────────────────────────────

      setFriends(MOCK_FRIENDS);
      setLoading(false);
    }

    fetchFriends();
  }, [user]);

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
