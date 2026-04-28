import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';

import Signup from './pages/Signup';
import Login from './pages/Login';
import Jobs from './pages/Jobs';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import Test from './pages/Test';
import Result from './pages/Result';
import VerifyEmail from './pages/VerifyEmail';

import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import GuestRoute from './components/GuestRoute';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';


function Home() {
  return (
    <section className="page-shell">
      <div className="page-card">
        <p className="auth-kicker">Job portal</p>
        <h1 className="page-title">Find your next opportunity</h1>
        <p className="page-copy">
          Create an account to register, log in securely, and continue to your dashboard.
        </p>
        <div className="page-actions">
          <Link className="top-nav__link top-nav__link--primary" to="/signup">
            Get started
          </Link>
          <Link className="top-nav__link" to="/login">
            Login
          </Link>
        </div>
      </div>
    </section>
  );
}

function AdminPanel() {
  return (
    <section className="page-shell">
      <div className="page-card">
        <p className="auth-kicker">Admin</p>
        <h1>Admin Panel</h1>
        <p className="page-copy">Manage protected content and admin-only actions here.</p>
      </div>
    </section>
  );
}

function shouldShowSidebar(pathname, user) {
  if (!user) {
    return false;
  }

  const sidebarRoutes = ['/dashboard', '/jobs', '/profile', '/test', '/result', '/admin'];

  return sidebarRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

function AppFrame() {
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const showSidebar = shouldShowSidebar(location.pathname, user);

  return (
    <>
      <Navbar />
      <div className={`app-shell${showSidebar ? ' app-shell--with-sidebar' : ''}`}>
        {showSidebar && <Sidebar />}
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route
              path="/login"
              element={
                <GuestRoute>
                  <Login />
                </GuestRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <GuestRoute>
                  <Signup />
                </GuestRoute>
              }
            />

            <Route
              path="/verify-email"
              element={
                <GuestRoute>
                  <VerifyEmail />
                </GuestRoute>
              }
            />

            {/* Protected */}
            <Route
              path="/jobs"
              element={
                <ProtectedRoute>
                  <Jobs />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/test"
              element={
                <ProtectedRoute>
                  <Test />
                </ProtectedRoute>
              }
            />

            <Route
              path="/result"
              element={
                <ProtectedRoute>
                  <Result />
                </ProtectedRoute>
              }
            />

            {/* Admin */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminPanel />
                </AdminRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppFrame />
      <Toaster position="bottom-right" />
    </Router>
  );
}

export default App;
