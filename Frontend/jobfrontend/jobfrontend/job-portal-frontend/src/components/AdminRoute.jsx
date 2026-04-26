import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';

function AdminRoute({ children }) {
  const { token, user } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location,
          message: 'Please log in to continue.',
        }}
      />
    );
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default AdminRoute;
