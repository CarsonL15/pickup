import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';

function HomeScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!user) return;

    async function fetchProfile() {
      const { data } = await supabase
        .from('app_user')
        .select('username, display_name')
        .eq('email', user.email)
        .single();

      if (data) setProfile(data);
    }

    fetchProfile();
  }, [user]);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/');
  }

  return (
    <div className="mainBackground">
      <div className="container">
        <h1>Welcome{profile?.display_name ? `, ${profile.display_name}` : ''}!</h1>
        <p>@{profile?.username || user?.email}</p>
        <button onClick={handleLogout}>Log Out</button>
      </div>
    </div>
  );
}

export default HomeScreen;
