import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';

const navItems = [
  {
    to: '/dashboard',
    shortLabel: 'DB',
    title: 'Dashboard',
    subtitle: 'Overview and quick stats',
  },
  {
    to: '/jobs',
    shortLabel: 'JB',
    title: 'Jobs',
    subtitle: 'Browse and filter roles',
  },
  {
    to: '/profile',
    shortLabel: 'PF',
    title: 'Profile',
    subtitle: 'Update account details',
  },
];

function Sidebar() {
  const { user } = useSelector((state) => state.auth);
  const displayName = user?.name?.trim() || user?.email?.trim() || 'Member';
  const items = user?.role === 'admin'
    ? [
        ...navItems,
        {
          to: '/admin',
          shortLabel: 'AD',
          title: 'Admin',
          subtitle: 'Protected admin tools',
        },
      ]
    : navItems;

  return (
    <aside className="app-sidebar">
      <div className="app-sidebar__intro">
        <p className="app-sidebar__eyebrow">Workspace</p>
        <h2 className="app-sidebar__title">Navigate your portal</h2>
        <p className="app-sidebar__copy">
          Jump between your dashboard, jobs, and profile from one focused sidebar.
        </p>
      </div>

      <nav className="app-sidebar__nav" aria-label="Sidebar navigation">
        {items.map((item) => (
          <NavLink
            className={({ isActive }) =>
              `app-sidebar__link${isActive ? ' app-sidebar__link--active' : ''}`
            }
            key={item.to}
            to={item.to}
          >
            <span aria-hidden="true" className="app-sidebar__icon">
              {item.shortLabel}
            </span>
            <span className="app-sidebar__content">
              <strong className="app-sidebar__label">{item.title}</strong>
              <span className="app-sidebar__meta">{item.subtitle}</span>
            </span>
          </NavLink>
        ))}
      </nav>

      <div className="app-sidebar__footer">
        <span className="app-sidebar__footer-label">Signed in as</span>
        <strong className="app-sidebar__footer-value">{displayName}</strong>
        <span className="app-sidebar__footer-mode">
          {user?.role === 'admin' ? 'Admin access enabled' : 'Candidate workspace'}
        </span>
      </div>
    </aside>
  );
}

export default Sidebar;
