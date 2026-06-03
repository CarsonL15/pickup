import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { getCurrentLocation } from '../getLocation';
import LobbyInviteModal from '../components/LobbyInviteModal';
import ModifyGameModal from '../components/ModifyGameModal';
import './HomeScreen.css';

// '4V4' -> 4, '2V2' -> 2, etc. Returns -1 ("any") if it can't parse.
function parseNumVs(format) {
  const n = parseInt(format, 10);
  return Number.isNaN(n) ? -1 : n;
}

const DEFAULT_SETTINGS = { mode: 'competitive', format: '4V4', haveBall: false };

function HomeScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [gameSettings, setGameSettings] = useState(DEFAULT_SETTINGS);
  const [invitedPlayers, setInvitedPlayers] = useState([]);
  const [searching, setSearching] = useState(false);
  const [myUserId, setMyUserId] = useState(null);
  const [partyId, setPartyId] = useState(null); // set once we invite someone (ad-hoc party)

  // resolve my integer app_user.user_id
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    supabase.from('app_user').select('user_id').eq('auth_id', user.id).maybeSingle()
      .then(({ data }) => { if (!cancelled && data) setMyUserId(data.user_id); });
    return () => { cancelled = true; };
  }, [user?.id]);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/');
  }

  // Inviting a friend creates an ad-hoc party (lazily, on the first invite) and
  // sends them a party_invite. They get a realtime popup to accept (PartyInviteListener).
  async function handleInvite(friend) {
    if (myUserId == null) return;
    let pid = partyId;
    if (pid == null) {
      const { data: party, error } = await supabase
        .from('party')
        .insert({ leader_id: myUserId, isTeam: false, status: 'forming' })
        .select('party_id').single();
      if (error || !party) { alert('Could not create party: ' + (error?.message ?? '')); return; }
      pid = party.party_id;
      await supabase.from('party_member').insert({ party_id: pid, user_id: myUserId });
      setPartyId(pid);
    }
    const { error: invErr } = await supabase
      .from('party_invite')
      .insert({ party_id: pid, inviter_id: myUserId, invitee_id: friend.id, status: 'pending' });
    if (invErr) { alert('Could not send invite: ' + invErr.message); return; }
    setInvitedPlayers(prev => [...prev, friend]);
  }

  // Queue flow (solo or party leader): get my location -> queue myself (with the
  // party_id if I have a party) -> if I'm a party leader, flip the party to
  // 'queued' so my accepted members self-queue with their own locations
  // (PartyInviteListener) -> go to the Finding Game lobby.
  async function handleSearch() {
    if (searching) return;
    setSearching(true);
    try {
      // 1. browser location (required so the matchmaker can find nearby parks)
      let lat, lon;
      try {
        ({ lat, lon } = await getCurrentLocation());
      } catch (err) {
        alert('We need your location to find nearby games. Please enable location access and try again.');
        return;
      }

      // 2. auth uuid -> integer app_user.user_id (queue_entry.player_id is the int id)
      const { data: appUser, error: userErr } = await supabase
        .from('app_user').select('user_id').eq('auth_id', user.id).maybeSingle();
      if (userErr || !appUser) {
        alert('Could not find your player profile. Please finish setting up your account.');
        return;
      }

      const isCasual = gameSettings.mode === 'casual';

      // 3. queue myself (share party_id when in a party so the matchmaker groups us).
      //    skill_rating is NULL for casual, a real rating for competitive
      //    (TODO: source from skill_rating/user_stats; placeholder for now).
      const { error: queueErr } = await supabase.from('queue_entry').insert({
        player_id: appUser.user_id,
        party_id: partyId,
        num_vs: parseNumVs(gameSettings.format),
        latitude: lat,
        longitude: lon,
        distance_preference: 50,
        is_casual: isCasual,
        skill_rating: isCasual ? null : 1000,
      });
      if (queueErr) {
        // PK conflict = already queued/in a game (queue_entry PK is player_id)
        alert('Could not join the queue: ' + queueErr.message);
        return;
      }

      // 4. if I'm leading a party, flip it to 'queued' -> members self-queue + follow
      if (partyId != null) {
        await supabase.from('party').update({ status: 'queued' }).eq('party_id', partyId);
      }

      // 5. hand off to the realtime lobby (haveBall is applied to our game_player row there)
      navigate('/FindingGameScreen', {
        state: {
          mode: gameSettings.mode,
          numVs: parseNumVs(gameSettings.format),
          haveBall: gameSettings.haveBall,
        },
      });
    } finally {
      setSearching(false);
    }
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

        <button className="search-btn" onClick={handleSearch} disabled={searching}>
          {searching ? 'SEARCHING…' : 'SEARCH'}
        </button>

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
