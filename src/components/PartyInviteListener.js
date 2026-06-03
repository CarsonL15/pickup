import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import './PartyInviteListener.css';

// App-wide party listener (mounted at the router root). Two jobs:
//   1. When someone invites me to a party (party_invite INSERT for me), show an
//      Accept/Decline popup. Accept -> join party_member; Decline -> mark declined.
//   2. When a party I'm in is queued by its leader (party.status -> 'queued'), I
//      self-queue with MY OWN location + the shared party_id, then ride into the
//      Finding Game lobby. (The leader queues + navigates itself, so it's skipped.)
export default function PartyInviteListener() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myUserId, setMyUserId] = useState(null);
  const [invite, setInvite] = useState(null); // { invite_id, party_id, inviter_username }

  // resolve my integer user_id
  useEffect(() => {
    if (!user) { setMyUserId(null); return; }
    let cancelled = false;
    supabase.from('app_user').select('user_id').eq('auth_id', user.id).maybeSingle()
      .then(({ data }) => { if (!cancelled && data) setMyUserId(data.user_id); });
    return () => { cancelled = true; };
  }, [user?.id]);

  // incoming party invites
  useEffect(() => {
    if (myUserId == null) return;
    let cancelled = false;

    // surface any invite already pending when the app loads
    (async () => {
      const { data } = await supabase
        .from('party_invite')
        .select('invite_id, party_id, inviter:app_user!party_invite_inviter_id_fkey(username)')
        .eq('invitee_id', myUserId).eq('status', 'pending')
        .order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (!cancelled && data) {
        setInvite({ invite_id: data.invite_id, party_id: data.party_id, inviter_username: data.inviter?.username });
      }
    })();

    const channel = supabase
      .channel(`party-invites-${myUserId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'party_invite', filter: `invitee_id=eq.${myUserId}` },
        async (payload) => {
          if (cancelled || payload.new.status !== 'pending') return;
          const { data } = await supabase
            .from('app_user').select('username').eq('user_id', payload.new.inviter_id).maybeSingle();
          setInvite({ invite_id: payload.new.invite_id, party_id: payload.new.party_id, inviter_username: data?.username });
        }
      )
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [myUserId]);

  // a party I'm in got queued -> self-queue with my own location + the party_id
  useEffect(() => {
    if (myUserId == null) return;
    let cancelled = false;

    const channel = supabase
      .channel(`party-status-${myUserId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'party' },
        async (payload) => {
          if (cancelled) return;
          const party = payload.new;
          if (party.status !== 'queued' || party.leader_id === myUserId) return; // leader self-queues elsewhere

          // am I a member of this party?
          const { data: membership } = await supabase
            .from('party_member').select('party_member_id')
            .eq('party_id', party.party_id).eq('user_id', myUserId).maybeSingle();
          if (cancelled || !membership) return;

          // use the LEADER's settings AND location for the whole party — simplest
          // fix: no per-member geolocation prompt, so everyone's queue row lands
          // together (closes the partial-team race window)
          const { data: leaderRow } = await supabase
            .from('queue_entry').select('is_casual, num_vs, latitude, longitude')
            .eq('player_id', party.leader_id).maybeSingle();
          if (cancelled) return;
          if (!leaderRow || leaderRow.latitude == null) {
            alert('Could not find the party leader in the queue.'); return;
          }
          const isCasual = leaderRow.is_casual ?? true;
          const numVs = leaderRow.num_vs ?? 5;

          const { error: queueErr } = await supabase.from('queue_entry').insert({
            player_id: myUserId, party_id: party.party_id, num_vs: numVs,
            latitude: leaderRow.latitude, longitude: leaderRow.longitude, distance_preference: 100,
            is_casual: isCasual, skill_rating: isCasual ? null : 1000,
          });
          if (queueErr) { alert('Could not join the game queue: ' + queueErr.message); return; }
          navigate('/FindingGameScreen', {
            state: { mode: isCasual ? 'casual' : 'competitive', numVs },
          });
        }
      )
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [myUserId, navigate]);

  async function accept() {
    if (!invite || myUserId == null) {
      alert('Not ready yet (still loading your account). Try again in a moment.');
      return;
    }
    const { error: memberErr } = await supabase
      .from('party_member').insert({ party_id: invite.party_id, user_id: myUserId });
    if (memberErr) { alert('Could not join party: ' + memberErr.message); return; }
    const { error: inviteErr } = await supabase
      .from('party_invite').update({ status: 'accepted' }).eq('invite_id', invite.invite_id);
    if (inviteErr) { alert('Joined, but could not update invite: ' + inviteErr.message); }
    setInvite(null);
    // go to Home and wait there with the party shown; the leader's SEARCH
    // (party.status -> 'queued') is what pulls me into the Finding Game lobby.
    navigate('/HomeScreen');
  }

  async function decline() {
    if (!invite) return;
    const { error } = await supabase
      .from('party_invite').update({ status: 'declined' }).eq('invite_id', invite.invite_id);
    if (error) { alert('Could not decline: ' + error.message); return; }
    setInvite(null);
  }

  if (!invite) return null;

  return (
    <div className="party-invite-pop">
      <span className="party-invite-text">
        <strong>@{invite.inviter_username || 'someone'}</strong> invited you to their party
      </span>
      <div className="party-invite-actions">
        <button className="party-invite-accept" onClick={accept}>ACCEPT</button>
        <button className="party-invite-decline" onClick={decline}>DECLINE</button>
      </div>
    </div>
  );
}
