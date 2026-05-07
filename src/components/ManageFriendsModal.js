import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './ManageFriendsModal.css';

// ─── Supabase integration points ─────────────────────────────────────────────
// Confirmed tables: friendship, app_user (user_id, username, email, display_name)
// Pending tables (need creating): friend_requests
//
// 1. Fetch friends:
//    const { data } = await supabase
//      .from('friendship')
//      .select('friend_id, app_user!friend_id(username)')
//      .eq('user_id', user.id);
//    setFriends(data.map(r => ({ id: r.friend_id, username: r.app_user.username })));
//
// 2. Fetch pending invites:
//    const { data } = await supabase
//      .from('friend_requests')
//      .select('id, sender_id, app_user!sender_id(username)')
//      .eq('receiver_id', user.id)
//      .eq('status', 'pending');
//    setPending(data.map(r => ({ id: r.id, senderId: r.sender_id, username: r.app_user.username })));
//
// 3. Delete friend:
//    await supabase.from('friendship')
//      .delete().eq('user_id', user.id).eq('friend_id', friendId);
//
// 4. Send friend request:
//    const { data: target } = await supabase
//      .from('app_user').select('user_id').eq('username', username).single();
//    await supabase.from('friend_requests')
//      .insert({ sender_id: user.id, receiver_id: target.user_id });
//
// 5. Accept invite:
//    await supabase.from('friend_requests')
//      .update({ status: 'accepted' }).eq('id', requestId);
//    await supabase.from('friendship')
//      .insert([{ user_id: user.id, friend_id: senderId }, { user_id: senderId, friend_id: user.id }]);
//
// 6. Decline invite:
//    await supabase.from('friend_requests')
//      .update({ status: 'declined' }).eq('id', requestId);
// ─────────────────────────────────────────────────────────────────────────────

function ManageFriendsModal({ onClose }) {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [pending, setPending] = useState([]);
  const [adding, setAdding] = useState(false);
  const [addUsername, setAddUsername] = useState('');

  useEffect(() => {
    if (!user) return;
    // Wire up Supabase queries here
  }, [user]);

  function handleDelete(id) {
    // supabase: DELETE FROM friends WHERE user_id = user.id AND friend_id = id
    setFriends(prev => prev.filter(f => f.id !== id));
  }

  function handleSendRequest() {
    if (!addUsername.trim()) return;
    // supabase: look up user by username, then INSERT into friend_requests
    setAdding(false);
    setAddUsername('');
  }

  function handleAccept(requestId) {
    // supabase: UPDATE friend_requests SET status = 'accepted', then INSERT into friends
    setPending(prev => prev.filter(p => p.id !== requestId));
  }

  function handleDecline(requestId) {
    // supabase: UPDATE friend_requests SET status = 'declined'
    setPending(prev => prev.filter(p => p.id !== requestId));
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="manage-friends-card" onClick={e => e.stopPropagation()}>

        <div className="mf-top">
          <div className="mf-header">
            <span className="mf-title">MANAGE FRIENDS</span>
            <button className="mf-close" onClick={onClose} aria-label="Close">X</button>
          </div>

          {friends.map(f => (
            <div className="mf-friend-row" key={f.id}>
              <span className="mf-friend-name">@{f.username}</span>
              <button className="mf-delete-btn" onClick={() => handleDelete(f.id)} aria-label="Remove friend">X</button>
              <button className="mf-chat-btn">CHAT</button>
            </div>
          ))}

          {adding ? (
            <div className="mf-add-row">
              <input
                className="mf-add-input"
                type="text"
                placeholder="@USERNAME"
                value={addUsername}
                onChange={e => setAddUsername(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendRequest()}
                autoFocus
              />
              <button className="mf-send-btn" onClick={handleSendRequest}>SEND</button>
            </div>
          ) : (
            <button className="mf-add-btn" onClick={() => setAdding(true)}>
              + (ADD FRIEND)
            </button>
          )}
        </div>

        <div className="mf-bottom">
          <p className="mf-pending-title">PENDING INVITES</p>
          {pending.map(p => (
            <div className="mf-pending-row" key={p.id}>
              <span className="mf-pending-name">@{p.username}</span>
              <div className="mf-pending-actions">
                <button className="mf-accept-btn" onClick={() => handleAccept(p.id)}>ACCEPT</button>
                <button className="mf-decline-btn" onClick={() => handleDecline(p.id)}>DECLINE</button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

export default ManageFriendsModal;
