import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './ManageTeamsModal.css';

// ─── Supabase integration points ─────────────────────────────────────────────
// 1. Fetch user's teams:
//    const { data } = await supabase
//      .from('team_members')
//      .select('team:teams(id, name, wins, losses, captain_id)')
//      .eq('user_id', user.id);
//    setTeams(data.map(r => r.team));
//
// 2. Leave team:
//    await supabase.from('team_members')
//      .delete().eq('user_id', user.id).eq('team_id', teamId);
//
// 3. Create team:
//    const { data } = await supabase.from('teams')
//      .insert({ name: teamName, captain_id: user.id }).select().single();
//    await supabase.from('team_members')
//      .insert({ user_id: user.id, team_id: data.id });
//
// 4. Join team (by team name or code):
//    const { data: team } = await supabase
//      .from('teams').select('id').eq('name', teamName).single();
//    await supabase.from('team_members')
//      .insert({ user_id: user.id, team_id: team.id });
// ─────────────────────────────────────────────────────────────────────────────

function ManageTeamsModal({ onClose }) {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [creating, setCreating] = useState(false);
  const [teamName, setTeamName] = useState('');

  useEffect(() => {
    if (!user) return;
    // TODO: wire up Supabase fetch when teams table is ready
  }, [user]);

  function handleLeave(teamId) {
    // TODO: supabase delete from team_members
    setTeams(prev => prev.filter(t => t.id !== teamId));
  }

  function handleCreate() {
    if (!teamName.trim()) return;
    // TODO: supabase insert into teams + team_members
    setCreating(false);
    setTeamName('');
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="manage-teams-card" onClick={e => e.stopPropagation()}>

        <div className="mt-top">
          <div className="mt-header">
            <span className="mt-title">MANAGE TEAMS</span>
            <button className="mt-close" onClick={onClose} aria-label="Close">X</button>
          </div>

          {teams.map(t => (
            <div className="mt-team-row" key={t.id}>
              <span className="mt-team-name">{t.name.toUpperCase()} {t.wins}-{t.losses}</span>
              <button className="mt-leave-btn" onClick={() => handleLeave(t.id)}>LEAVE</button>
            </div>
          ))}

          {creating ? (
            <div className="mt-add-row">
              <input
                className="mt-add-input"
                type="text"
                placeholder="TEAM NAME"
                value={teamName}
                onChange={e => setTeamName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                autoFocus
              />
              <button className="mt-send-btn" onClick={handleCreate}>CREATE</button>
            </div>
          ) : (
            <button className="mt-add-btn" onClick={() => setCreating(true)}>
              + (CREATE TEAM)
            </button>
          )}
        </div>

        <div className="mt-bottom">
          <p className="mt-pending-title">JOIN A TEAM</p>
          <div className="mt-add-row">
            <input
              className="mt-add-input"
              type="text"
              placeholder="TEAM NAME"
            />
            <button className="mt-send-btn">JOIN</button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default ManageTeamsModal;
