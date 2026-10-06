import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../Auth/Auth.css';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function set(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-box card">
        <h1 className="auth-title">Create account</h1>

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="auth-label">
            Your name
            <input
              type="text"
              className="auth-input"
              value={form.name}
              onChange={set('name')}
              placeholder="First and last name"
              required
              autoFocus
            />
          </label>

          <label className="auth-label">
            Email address
            <input
              type="email"
              className="auth-input"
              value={form.email}
              onChange={set('email')}
              required
            />
          </label>

          <label className="auth-label">
            Password
            <input
              type="password"
              className="auth-input"
              value={form.password}
              onChange={set('password')}
              placeholder="At least 6 characters"
              minLength={6}
              required
            />
          </label>

          <label className="auth-label">
            Re-enter password
            <input
              type="password"
              className="auth-input"
              value={form.confirm}
              onChange={set('confirm')}
              required
            />
          </label>

          {error && <p className="error-msg">{error}</p>}

          <button type="submit" className="btn-primary auth-submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Continue'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
