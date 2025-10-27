// /client/src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    if (result.success) {
      navigate('/'); // ไปหน้าแรก (หรือจะเปลี่ยนเป็น /admin ก็ได้)
    } else {
      setError(result.message || 'Failed to login');
      setLoading(false);
    }
  };

  // --- Styles ---
  const pageStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - 100px)',
    padding: '2rem',
  };
  const formContainerStyle = {
    maxWidth: '400px',
    width: '100%',
    padding: '2rem 2.5rem',
    background: '#1c1c1c',
    borderRadius: '8px',
    border: '1px solid #333',
  };
  const inputGroupStyle = { marginBottom: '1rem' };
  const labelStyle = { display: 'block', marginBottom: '5px', color: '#aaa' };
  const inputStyle = {
    width: '100%',
    boxSizing: 'border-box',
    background: '#222',
    color: '#fff',
    border: '1px solid #333',
    padding: '0.5rem',
    borderRadius: '4px',
  };
  const buttonStyle = {
    width: '100%',
    padding: '12px',
    fontSize: '1rem',
    fontWeight: 'bold',
    background: '#e5b80b',
    color: '#141414',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background 0.2s',
  };
  const disabledButtonStyle = {
    ...buttonStyle,
    background: '#555',
    color: '#888',
    cursor: 'not-allowed',
  };
  const linkStyle = { color: '#e5b80b', fontWeight: 'bold' };

  return (
    <div style={pageStyle}>
      <div style={formContainerStyle}>
        <h2
          style={{
            color: '#f4f4f4',
            textAlign: 'center',
            marginTop: 0,
            marginBottom: '1.5rem',
          }}
        >
          Login
        </h2>
        <form onSubmit={handleSubmit}>
          <div style={inputGroupStyle}>
            <label htmlFor="login-email" style={labelStyle}>
              Email:
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={inputStyle}
            />
          </div>
          <div style={inputGroupStyle}>
            <label htmlFor="login-password" style={labelStyle}>
              Password:
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={inputStyle}
            />
          </div>

          {error && (
            <p className="error-message" style={{ color: 'red', marginTop: '1rem' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={loading ? disabledButtonStyle : buttonStyle}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p style={{ marginTop: '1.5rem', color: '#aaa', textAlign: 'center' }}>
          Don't have an account?{' '}
          <Link to="/register" style={linkStyle}>
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
