import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const { token } = useSelector((state) => state.auth);
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

  return children;
}

export default ProtectedRoute;
