import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
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
    <div className="screen" style={{ justifyContent: 'center' }}>
      <h1 className="text-accent" style={{ marginBottom: 'var(--space-8)' }}>Log In</h1>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
        <div>
          <label style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)', display: 'block' }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-text-muted)',
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              fontFamily: 'var(--font-family)',
              fontSize: 'var(--text-base)',
            }}
          />
        </div>
        <div>
          <label style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)', display: 'block' }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: '100%',
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-text-muted)',
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              fontFamily: 'var(--font-family)',
              fontSize: 'var(--text-base)',
            }}
          />
        </div>
        {error && (
          <div style={{
            background: 'rgba(255, 0, 0, 0.15)',
            border: '1px solid rgba(255, 0, 0, 0.4)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-3) var(--space-4)',
            color: '#ff6b6b',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--font-bold)',
          }}>{error}</div>
        )}
        <div style={{ marginTop: 'var(--space-8)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <button type="submit" className="btn btn-accent" style={{ margin: 0 }} disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <button type="button" className="btn btn-primary" style={{ margin: 0 }}>Cancel</button>
          </Link>
        </div>
      </form>
    </div>
  );
}

export default LoginScreen;
