import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import './ManageTeamsModal.css';

// Persistent teams (stat-tracking only — no queue/invite flow). You create a team
// and pick who's on it directly; members are added immediately (no acceptance).
// A team's record comes from the team_record() SQL function (games where a side's
// exact roster equals the team).
function ManageTeamsModal({ onClose }) {
  const { user } = useAuth();
  const [myUserId, setMyUserId] = useState(null);
  const [teams, setTeams] = useState([]);     // { id, name, wins, losses }
  const [friends, setFriends] = useState([]); // { id, username }
  const [creating, setCreating] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [selected, setSelected] = useState([]); // chosen friend user_ids
  const [error, setError] = useState('');

  const loadTeams = useCallback(async (uid) => {
    const { data: mems } = await supabase
      .from('team_member').select('team_id, team(name)').eq('user_id', uid);
    if (!mems) return;
    const withRecords = await Promise.all(
      mems.filter(m => m.team).map(async (m) => {
        const { data: rec } = await supabase.rpc('team_record', { p_team_id: m.team_id });
        const r = Array.isArray(rec) ? rec[0] : rec;
        return { id: m.team_id, name: m.team.name, wins: r?.wins ?? 0, losses: r?.losses ?? 0 };
      })
    );
    setTeams(withRecords);
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data: appUser } = await supabase
        .from('app_user').select('user_id').eq('auth_id', user.id).maybeSingle();
      if (!appUser || cancelled) return;
      setMyUserId(appUser.user_id);
      loadTeams(appUser.user_id);

      const { data: fr } = await supabase
        .from('friendship')
        .select('requester_id, receiver_id, requester:app_user!friendship_requester_id_fkey(user_id, username), receiver:app_user!friendship_receiver_id_fkey(user_id, username)')
        .or(`requester_id.eq.${appUser.user_id},receiver_id.eq.${appUser.user_id}`)
        .eq('status', 'accepted');
      if (fr && !cancelled) {
        setFriends(fr.map(r => {
          const f = r.requester_id === appUser.user_id ? r.receiver : r.requester;
          return { id: f?.user_id, username: f?.username };
        }).filter(f => f.id));
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id, loadTeams]);

  function toggleSelect(fid) {
    setSelected(prev => prev.includes(fid) ? prev.filter(x => x !== fid) : [...prev, fid]);
  }

  async function handleCreate() {
    if (!teamName.trim() || myUserId == null) return;
    setError('');
    const { data: team, error: teamErr } = await supabase
      .from('team').insert({ name: teamName.trim(), creator_id: myUserId }).select('team_id').single();
    if (teamErr || !team) { setError('Could not create team: ' + (teamErr?.message ?? '')); return; }

    const memberRows = [myUserId, ...selected].map(uid => ({ team_id: team.team_id, user_id: uid }));
    const { error: memErr } = await supabase.from('team_member').insert(memberRows);
    if (memErr) { setError('Team created, but could not add all members: ' + memErr.message); }

    setCreating(false);
    setTeamName('');
    setSelected([]);
    loadTeams(myUserId);
  }

  async function handleLeave(teamId) {
    if (myUserId == null) return;
    await supabase.from('team_member').delete().eq('team_id', teamId).eq('user_id', myUserId);
    setTeams(prev => prev.filter(t => t.id !== teamId));
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="manage-teams-card" onClick={e => e.stopPropagation()}>

        <div className="mt-top">
          <div className="mt-header">
            <span className="mt-title">MANAGE TEAMS</span>
            <button className="mt-close" onClick={onClose} aria-label="Close">X</button>
          </div>

          {teams.length === 0 && <p className="mt-pending-title">No teams yet</p>}
          {teams.map(t => (
            <div className="mt-team-row" key={t.id}>
              <span className="mt-team-name">{t.name.toUpperCase()} {t.wins}-{t.losses}</span>
              <button className="mt-leave-btn" onClick={() => handleLeave(t.id)}>LEAVE</button>
            </div>
          ))}

          {creating ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
              <input
                className="mt-add-input"
                type="text"
                placeholder="TEAM NAME"
                value={teamName}
                onChange={e => setTeamName(e.target.value)}
                autoFocus
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', maxHeight: 180, overflowY: 'auto' }}>
                {friends.length === 0 && (
                  <span className="mt-pending-title">Add friends first to put them on a team</span>
                )}
                {friends.map(f => (
                  <label key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={selected.includes(f.id)}
                      onChange={() => toggleSelect(f.id)}
                    />
                    @{f.username}
                  </label>
                ))}
              </div>
              <button className="mt-send-btn" onClick={handleCreate}>CREATE</button>
              {error && <p style={{ color: 'var(--color-reporter)', margin: 0 }}>{error}</p>}
            </div>
          ) : (
            <button className="mt-add-btn" onClick={() => setCreating(true)}>
              + (CREATE TEAM)
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

export default ManageTeamsModal;
