
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import StatusMessage from '../components/StatusMessage';
import { clearAuthError, registerUser } from '../features/authSlice';

const initialForm = { name: '', email: '', password: '' };
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Signup() {
  const [form, setForm] = useState(initialForm);
  const [errorMsg, setErrorMsg] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  const updateField = (field) => (e) => {
    setForm((currentForm) => ({ ...currentForm, [field]: e.target.value }));

    if (errorMsg) {
      setErrorMsg('');
    }

    if (error) {
      dispatch(clearAuthError());
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const payload = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
    };

    if (!payload.name || !payload.email || !payload.password) {
      setErrorMsg('Please fill in all fields.');
      return;
    }

    if (!emailPattern.test(payload.email)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (payload.password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    try {
      await dispatch(registerUser(payload)).unwrap();
      // No token returned — backend sends OTP email instead
      navigate('/verify-email', { replace: true });
    } catch {
      // Error text is shown from Redux state.
    }
  };

  const isSubmitDisabled =
    loading || !form.name.trim() || !form.email.trim() || !form.password;

  return (
    <section className="auth-page">
      <div className="auth-card">
        <p className="auth-kicker">Create account</p>
        <h2>Signup</h2>
        <p className="auth-subtitle">Register with your email and password to continue.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="signup-name">Name</label>
            <input
              id="signup-name"
              className="auth-input"
              placeholder="Lakshmibr"
              value={form.name}
              onChange={updateField('name')}
              autoComplete="name"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="signup-email">Email</label>
            <input
              id="signup-email"
              className="auth-input"
              type="email"
              placeholder="lakshmibr2003@gmail.com"
              value={form.email}
              onChange={updateField('email')}
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              className="auth-input"
              type="password"
              placeholder="At least 6 characters"
              value={form.password}
              onChange={updateField('password')}
              autoComplete="new-password"
            />
          </div>

          <button className="auth-button" type="submit" disabled={isSubmitDisabled}>
            {loading ? 'Registering…' : 'Register'}
          </button>
        </form>

        <StatusMessage message={errorMsg} variant="error" />
        <StatusMessage message={error} title="Signup failed" variant="error" />

        <p className="auth-footer">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </section>
  );
}

export default Signup;
