import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import './ManageFriendsModal.css';

function ManageFriendsModal({ onClose, myUserId: myUserIdProp, onFriendsChange }) {
  const { user } = useAuth();
  const [myUserId, setMyUserId] = useState(myUserIdProp ?? null);
  const [friends, setFriends] = useState([]);
  const [pending, setPending] = useState([]);
  const [adding, setAdding] = useState(false);
  const [addUsername, setAddUsername] = useState('');
  const [addError, setAddError] = useState('');

  const loadData = useCallback(async (userId) => {
    const [friendsRes, pendingRes] = await Promise.all([
      supabase
        .from('friendship')
        .select('friendship_id, requester_id, receiver_id, requester:app_user!friendship_requester_id_fkey(user_id, username), receiver:app_user!friendship_receiver_id_fkey(user_id, username)')
        .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
        .eq('status', 'accepted'),
      supabase
        .from('friendship')
        .select('friendship_id, requester_id, requester:app_user!friendship_requester_id_fkey(username)')
        .eq('receiver_id', userId)
        .eq('status', 'pending'),
    ]);

    if (friendsRes.data) {
      setFriends(friendsRes.data.map(r => {
        const friend = r.requester_id === userId ? r.receiver : r.requester;
        return { id: r.friendship_id, friendUserId: friend?.user_id, username: friend?.username };
      }));
    }

    if (pendingRes.data) {
      setPending(pendingRes.data.map(r => ({
        id: r.friendship_id,
        senderId: r.requester_id,
        username: r.requester?.username,
      })));
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    if (myUserIdProp) {
      loadData(myUserIdProp);
      return;
    }
    supabase
      .from('app_user')
      .select('user_id')
      .eq('auth_id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setMyUserId(data.user_id);
          loadData(data.user_id);
        }
      });
  }, [user?.id, myUserIdProp, loadData]);

  async function handleDelete(friendshipId) {
    const { error } = await supabase.from('friendship').delete().eq('friendship_id', friendshipId);
    if (!error) {
      setFriends(prev => prev.filter(f => f.id !== friendshipId));
      onFriendsChange?.();
    }
  }

  async function handleSendRequest() {
    if (!addUsername.trim()) return;
    setAddError('');

    const { data: target } = await supabase
      .from('app_user')
      .select('user_id')
      .eq('username', addUsername.trim())
      .single();

    if (!target) {
      setAddError('User not found.');
      return;
    }

    if (target.user_id === myUserId) {
      setAddError("You can't add yourself.");
      return;
    }

    if (friends.some(f => f.friendUserId === target.user_id)) {
      setAddError('You are already friends.');
      return;
    }

    // block duplicates: any existing friendship/request in EITHER direction
    const { data: existingRows } = await supabase
      .from('friendship')
      .select('status')
      .or(`and(requester_id.eq.${myUserId},receiver_id.eq.${target.user_id}),and(requester_id.eq.${target.user_id},receiver_id.eq.${myUserId})`);
    if (existingRows && existingRows.length > 0) {
      setAddError(existingRows.some(r => r.status === 'accepted')
        ? 'You are already friends.'
        : 'A friend request already exists.');
      return;
    }

    const { error } = await supabase
      .from('friendship')
      .insert({ requester_id: myUserId, receiver_id: target.user_id, status: 'pending' });

    if (error) {
      setAddError('Request already sent or you are already friends.');
      return;
    }

    setAdding(false);
    setAddUsername('');
  }

  async function handleAccept(requestId, senderId) {
    const { error } = await supabase
      .from('friendship')
      .update({ status: 'accepted' })
      .eq('friendship_id', requestId);
    if (error) { setAddError('Could not accept request.'); return; }
    setPending(prev => prev.filter(p => p.id !== requestId));
    loadData(myUserId);
    onFriendsChange?.();
  }

  async function handleDecline(requestId) {
    await supabase
      .from('friendship')
      .update({ status: 'declined' })
      .eq('friendship_id', requestId);
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
                onChange={e => { setAddUsername(e.target.value); setAddError(''); }}
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
          {addError && <p className="mf-error">{addError}</p>}
        </div>

        <div className="mf-bottom">
          <p className="mf-pending-title">PENDING INVITES</p>
          {pending.length === 0 && <p className="mf-empty">No pending requests</p>}
          {pending.map(p => (
            <div className="mf-pending-row" key={p.id}>
              <span className="mf-pending-name">@{p.username}</span>
              <div className="mf-pending-actions">
                <button className="mf-accept-btn" onClick={() => handleAccept(p.id, p.senderId)}>ACCEPT</button>
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
