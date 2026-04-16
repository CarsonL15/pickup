import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';

function HomeScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/');
  }

  return (
    <div className="mainBackground">
      <div className="container">
        <h1>Welcome!</h1>
        <p>Logged in as: {user?.email}</p>
        <button onClick={handleLogout}>Log Out</button>
      </div>
    </div>
  );
}

export default HomeScreen;
