import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const inputStyle = {
  width: '100%',
  padding: 'var(--space-3) var(--space-4)',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-text-muted)',
  background: 'var(--color-surface)',
  color: 'var(--color-text)',
  fontFamily: 'var(--font-family)',
  fontSize: 'var(--text-base)',
};

const labelStyle = {
  fontSize: 'var(--text-sm)',
  color: 'var(--color-text-muted)',
  marginBottom: 'var(--space-1)',
  display: 'block',
};

const PASSWORD_RULES = [
  { test: (pw) => pw.length >= 8, label: 'At least 8 characters' },
  { test: (pw) => /[A-Z]/.test(pw), label: 'One uppercase letter' },
  { test: (pw) => /[a-z]/.test(pw), label: 'One lowercase letter' },
  { test: (pw) => /[0-9]/.test(pw), label: 'One number' },
];

function ProfileCreationScreen() {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState(null); // 'available', 'taken', 'checking'
  const navigate = useNavigate();
  const debounceRef = useRef(null);

  // Real-time username availability check
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!username.trim()) {
      setUsernameStatus(null);
      return;
    }

    setUsernameStatus('checking');

    debounceRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from('app_user')
        .select('user_id')
        .eq('username', username.trim())
        .single();

      setUsernameStatus(data ? 'taken' : 'available');
    }, 500);

    return () => clearTimeout(debounceRef.current);
  }, [username]);

  const allPasswordRulesMet = PASSWORD_RULES.every((rule) => rule.test(password));
  const passwordsMatch = password === confirmPassword;

  async function handleCreateProfile(e) {
    e.preventDefault();
    setError('');

    if (!allPasswordRulesMet) {
      setError('Password does not meet all requirements.');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }

    if (usernameStatus === 'taken') {
      setError('Username is already taken.');
      return;
    }

    setIsLoading(true);

    // Create Supabase Auth account
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setError(authError.message === 'User already registered' ? 'Email is already taken.' : authError.message);
      setIsLoading(false);
      return;
    }

    if (!authData?.user?.id) {
      setError('Sign-up succeeded but no user was returned. If email confirmation is enabled in Supabase, finish creating your profile after clicking the confirmation link.');
      setIsLoading(false);
      return;
    }

    // Insert app_user record, linking back to the auth.users row via auth_id
    const { error: insertError } = await supabase
      .from('app_user')
      .insert({
        auth_id: authData.user.id,
        username: username.trim(),
        email,
        display_name: displayName.trim() || null,
      });

    if (insertError) {
      setError(insertError.message);
      setIsLoading(false);
      return;
    }

    navigate('/HomeScreen');
  }

  return (
    <div className="screen" style={{ justifyContent: 'center' }}>
      <h1 className="text-accent" style={{ marginBottom: 'var(--space-8)' }}>Create Profile</h1>
      <form onSubmit={handleCreateProfile} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
        <div>
          <label style={labelStyle}>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={inputStyle}
          />
          {usernameStatus && (
            <p style={{
              fontSize: 'var(--text-xs)',
              marginTop: 'var(--space-1)',
              color: usernameStatus === 'available' ? '#4ade80' : usernameStatus === 'taken' ? '#ff6b6b' : 'var(--color-text-muted)',
            }}>
              {usernameStatus === 'checking' && 'Checking availability...'}
              {usernameStatus === 'available' && 'Username is available'}
              {usernameStatus === 'taken' && 'Username is already taken'}
            </p>
          )}
        </div>
        <div>
          <label style={labelStyle}>Display Name <span style={{ color: 'var(--color-text-muted)' }}>(optional)</span></label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={inputStyle}
          />
          {password && (
            <div style={{ marginTop: 'var(--space-2)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {PASSWORD_RULES.map((rule) => (
                <p key={rule.label} style={{
                  fontSize: 'var(--text-xs)',
                  color: rule.test(password) ? '#4ade80' : 'var(--color-text-muted)',
                }}>
                  {rule.test(password) ? '\u2713' : '\u2022'} {rule.label}
                </p>
              ))}
            </div>
          )}
        </div>
        <div>
          <label style={labelStyle}>Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            style={inputStyle}
          />
          {confirmPassword && (
            <p style={{
              fontSize: 'var(--text-xs)',
              marginTop: 'var(--space-1)',
              color: passwordsMatch ? '#4ade80' : '#ff6b6b',
            }}>
              {passwordsMatch ? '\u2713 Passwords match' : 'Passwords do not match'}
            </p>
          )}
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
            {isLoading ? 'Creating...' : 'Create Profile'}
          </button>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <button type="button" className="btn btn-primary" style={{ margin: 0 }}>Cancel</button>
          </Link>
        </div>
      </form>
    </div>
  );
}

export default ProfileCreationScreen;
