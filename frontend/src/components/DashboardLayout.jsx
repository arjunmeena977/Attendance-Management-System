import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout, selectCurrentUser } from '../features/auth/authSlice';
import toast from 'react-hot-toast';

// Nav config per role
const NAV_ITEMS = {
  employee: [
    { path: '/dashboard',     icon: '🏠', label: 'Dashboard' },
    { path: '/punch',         icon: '⏱',  label: 'Punch In / Out' },
    { path: '/my-attendance', icon: '📋', label: 'My Attendance' },
    { path: '/reports',       icon: '📊', label: 'Reports' },
  ],
  manager: [
    { path: '/dashboard',      icon: '🏠', label: 'Dashboard' },
    { path: '/team-attendance',icon: '👥', label: 'Team Attendance' },
    { path: '/overtime',       icon: '⏰', label: 'Overtime Requests' },
    { path: '/reports',        icon: '📊', label: 'Reports' },
  ],
  admin: [
    { path: '/dashboard',      icon: '🏠', label: 'Dashboard' },
    { path: '/team-attendance',icon: '👥', label: 'All Attendance' },
    { path: '/overtime',       icon: '⏰', label: 'Overtime Requests' },
    { path: '/users',          icon: '🛡', label: 'User Management' },
    { path: '/reports',        icon: '📊', label: 'Reports' },
  ],
};

const PAGE_TITLES = {
  '/dashboard':       { title: 'Dashboard',           subtitle: 'Overview of your attendance system' },
  '/punch':           { title: 'Punch In / Out',       subtitle: 'Mark your attendance for today' },
  '/my-attendance':   { title: 'My Attendance',        subtitle: 'Your personal attendance history' },
  '/team-attendance': { title: 'Team Attendance',      subtitle: 'Monitor and validate team records' },
  '/overtime':        { title: 'Overtime Requests',    subtitle: 'Review and approve overtime' },
  '/users':           { title: 'User Management',      subtitle: 'Manage users, roles & departments' },
  '/reports':         { title: 'Reports',              subtitle: 'Daily attendance reports' },
};

const LiveClock = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="header-time">
      {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      {' '}·{' '}
      {time.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
    </span>
  );
};

const DashboardLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector(selectCurrentUser);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = NAV_ITEMS[user?.role] || NAV_ITEMS.employee;
  const pageInfo = PAGE_TITLES[location.pathname] || { title: 'AttendPro', subtitle: '' };

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Logged out successfully.');
    navigate('/login');
  };

  // Close sidebar when navigating on mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const roleColor = { admin: 'badge-danger', manager: 'badge-blue', employee: 'badge-success' };

  return (
    <div className="app-shell">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 199,
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="logo-mark">⏱</div>
          <div>
            <div className="logo-text">AttendPro</div>
            <div className="logo-tagline">Management System</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="nav-section-label">Navigation</div>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User Info + Logout */}
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar-lg">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="user-details">
              <div className="user-fullname">{user?.name || 'User'}</div>
              <div className="user-role-pill">
                <span className={`badge ${roleColor[user?.role] || 'badge-muted'}`} style={{ fontSize: '9px', padding: '1px 7px' }}>
                  {user?.role}
                </span>
              </div>
            </div>
            <button className="logout-btn" onClick={handleLogout} title="Logout">
              ⏏
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="main-content">
        {/* Top Header */}
        <header className="top-header">
          <div className="header-left">
            <button
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle menu"
            >
              ☰
            </button>
            <div>
              <div className="header-title">{pageInfo.title}</div>
              {pageInfo.subtitle && (
                <div className="header-subtitle">{pageInfo.subtitle}</div>
              )}
            </div>
          </div>
          <div className="header-right">
            <LiveClock />
            <div
              className="user-avatar-lg"
              style={{ width: 32, height: 32, fontSize: 13, cursor: 'default' }}
              title={`${user?.name} (${user?.role})`}
            >
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-wrapper">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;


//  jjjkj