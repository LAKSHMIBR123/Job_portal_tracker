import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../features/authSlice';
import { Link, useLocation } from 'react-router-dom';
import NotificationPanel from './NotificationPanel';

function getSectionTitle(pathname) {
  const sectionMap = [
    ['/dashboard', 'Dashboard'],
    ['/jobs', 'Jobs'],
    ['/profile', 'Profile'],
    ['/test', 'Test'],
    ['/result', 'Result'],
    ['/admin', 'Admin'],
  ];

  const match = sectionMap.find(([path]) => pathname.startsWith(path));
  return match ? match[1] : 'Welcome';
}

function Navbar() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();
  const displayName = user?.name?.trim() || user?.email?.trim() || 'Member';
  const sectionTitle = getSectionTitle(location.pathname);

  return (
    <nav className="top-nav">
      <div className="top-nav__brand-group">
        <Link className="top-nav__brand" to={user ? '/dashboard' : '/'}>
          <span className="top-nav__brand-mark" aria-hidden="true">
            JP
          </span>
          <span>Job Portal</span>
        </Link>

        {user && (
          <div className="top-nav__context">
            <span className="top-nav__context-label">Current section</span>
            <strong className="top-nav__context-title">{sectionTitle}</strong>
          </div>
        )}
      </div>

      <div className="top-nav__links">
        {user ? (
          <>
            <div className="top-nav__user-chip">
              <span className="top-nav__user-label">Signed in as</span>
              <strong className="top-nav__user-value">{displayName}</strong>
            </div>
            <NotificationPanel />
            {user.role === 'admin' && (
              <Link className="top-nav__link" to="/admin">
                Admin panel
              </Link>
            )}
            <button className="top-nav__button" onClick={() => dispatch(logout())}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link className="top-nav__link" to="/login">
              Login
            </Link>
            <Link className="top-nav__link top-nav__link--primary" to="/signup">
              Signup
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
