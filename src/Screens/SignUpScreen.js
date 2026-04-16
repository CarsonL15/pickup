import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSignUp(e) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    setIsLoading(false);

    if (error) {
      setError(error.message);
    } else {
      navigate('/HomeScreen');
    }
  }

  return (
    <div className="mainBackground">
      <div className="container">
        <div className="welcomeMessage">
          <h1>Create Profile</h1>
        </div>
        <form onSubmit={handleSignUp}>
          <div className="userInfo">
            <p>Email</p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <p>Password</p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          {error && <p style={{ color: '#ff0000' }}>{error}</p>}
          <div>
            <Link to="/"><button type="button">Cancel</button></Link>
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Sign Up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SignUpScreen;
