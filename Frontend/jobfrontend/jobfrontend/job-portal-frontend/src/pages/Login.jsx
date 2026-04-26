
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import StatusMessage from '../components/StatusMessage';
import { clearAuthError, loginUser } from '../features/authSlice';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getRedirectTarget(state, user) {
  const from = state?.from;
  const pathname = typeof from?.pathname === 'string' ? from.pathname : '';

  if (pathname && pathname !== '/login' && pathname !== '/signup') {
    return `${pathname}${from?.search || ''}${from?.hash || ''}`;
  }

  return user?.role === 'admin' ? '/admin' : '/dashboard';
}

function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errorMsg, setErrorMsg] = useState('');
  const [dismissNotice, setDismissNotice] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState(null);
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, token, loading, error } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  useEffect(() => {
    if (token) {
      navigate(getRedirectTarget(location.state, user), { replace: true });
    }
  }, [token, user, navigate, location.state]);

  const updateField = (field) => (e) => {
    setForm((currentForm) => ({ ...currentForm, [field]: e.target.value }));
    setUnverifiedEmail(null);

    if (errorMsg) {
      setErrorMsg('');
    }

    if (!dismissNotice) {
      setDismissNotice(true);
    }

    if (error) {
      dispatch(clearAuthError());
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setDismissNotice(true);
    setUnverifiedEmail(null);

    const payload = {
      email: form.email.trim().toLowerCase(),
      password: form.password,
    };

    if (!payload.email || !payload.password) {
      setErrorMsg('Please fill in all fields.');
      return;
    }

    if (!emailPattern.test(payload.email)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    try {
      await dispatch(loginUser(payload)).unwrap();
    } catch (err) {
      // Check if the error is EMAIL_NOT_VERIFIED (object returned from rejectWithValue)
      if (err && typeof err === 'object' && err.code === 'EMAIL_NOT_VERIFIED') {
        setUnverifiedEmail(err.data?.email || payload.email);
      }
    }
  };

  const noticeMsg = dismissNotice ? '' : location.state?.message || '';
  const isSubmitDisabled = loading || !form.email.trim() || !form.password;

  // Resolve the display error (exclude EMAIL_NOT_VERIFIED object from generic error display)
  const displayError =
    error && typeof error === 'string'
      ? error
      : error && typeof error === 'object' && error.code !== 'EMAIL_NOT_VERIFIED'
      ? error.message || 'Login failed'
      : null;

  return (
    <section className="auth-page">
      <div className="auth-card">
        <p className="auth-kicker">Welcome back</p>
        <h2>Login</h2>
        <p className="auth-subtitle">Use the same email and password you registered with.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              className="auth-input"
              type="email"
              placeholder="lakshmibr2003@gmail.com"
              value={form.email}
              onChange={updateField('email')}
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              className="auth-input"
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={updateField('password')}
              autoComplete="current-password"
            />
          </div>

          <button className="auth-button" type="submit" disabled={isSubmitDisabled}>
            {loading ? 'Logging in…' : 'Login'}
          </button>
        </form>

        <StatusMessage message={noticeMsg} variant="success" />
        <StatusMessage message={errorMsg} variant="error" />
        {displayError && (
          <StatusMessage message={displayError} title="Login failed" variant="error" />
        )}

        {/* EMAIL_NOT_VERIFIED banner */}
        {unverifiedEmail && (
          <div className="verify-notice">
            <span className="verify-notice-icon">📧</span>
            <div>
              <p className="verify-notice-title">Email not verified</p>
              <p className="verify-notice-body">
                Please verify your email before logging in.{' '}
                <Link className="verify-notice-link" to="/verify-email">
                  Verify now →
                </Link>
              </p>
            </div>
          </div>
        )}

        <p className="auth-footer">
          New here? <Link to="/signup">Create an account</Link>
        </p>
      </div>
    </section>
  );
}

export default Login;
