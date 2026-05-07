import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './ProfileScreen.css';

const SECTIONS = [
  { key: 'stats',    label: 'Stats',           path: '/StatsScreen' },
  { key: 'friends',  label: 'Friends',          path: '/FriendsScreen' },
  { key: 'ratings',  label: 'Ratings',          path: '/RatingsScreen' },
  { key: 'teams',    label: 'Teams',            path: '/TeamsScreen' },
];

function ProfileScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const username =
    user?.user_metadata?.username ??
    user?.email?.split('@')[0] ??
    'Player';

  return (
    <div className="screen">
      <div className="profile-header">
        <div className="profile-avatar" />
        <h1 className="profile-username">{username}</h1>
        <p className="profile-email">{user?.email}</p>
      </div>

      <nav className="profile-sections">
        {SECTIONS.map(({ key, label, path }) => (
          <button
            key={key}
            className="profile-section-card"
            onClick={() => navigate(path)}
          >
            <span className="profile-section-label">{label}</span>
            <span className="profile-section-chevron">&#8250;</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

export default ProfileScreen;
