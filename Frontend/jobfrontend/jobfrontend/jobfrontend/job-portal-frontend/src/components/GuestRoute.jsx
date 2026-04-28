import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';

function getRedirectTarget(state, user) {
  const from = state?.from;
  const pathname = typeof from?.pathname === 'string' ? from.pathname : '';

  if (pathname && pathname !== '/login' && pathname !== '/signup') {
    return `${pathname}${from?.search || ''}${from?.hash || ''}`;
  }

  return user?.role === 'admin' ? '/admin' : '/dashboard';
}

function GuestRoute({ children }) {
  const { token, user } = useSelector((state) => state.auth);
  const location = useLocation();

  if (token) {
    return <Navigate to={getRedirectTarget(location.state, user)} replace />;
  }

  return children;
}

export default GuestRoute;
