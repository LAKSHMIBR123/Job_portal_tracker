import { useDispatch } from 'react-redux';
import { logout } from '../features/authSlice';

function LogoutBtn() {
  const dispatch = useDispatch();

  return <button onClick={() => dispatch(logout())}>Logout</button>;
}

export default LogoutBtn;
