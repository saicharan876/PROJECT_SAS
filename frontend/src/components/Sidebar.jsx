import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiGrid, FiFileText, FiCheckSquare, FiSearch, FiAward, FiCode, FiList, FiSettings, FiLogOut } from 'react-icons/fi';
import './Sidebar.css';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: <FiGrid /> },
  { path: '/cv-builder', label: 'CV Builder', icon: <FiFileText /> },
  { path: '/ats-checker', label: 'ATS Checker', icon: <FiCheckSquare /> },
  { path: '/assignments', label: 'Assignments', icon: <FiSearch /> },
  { path: '/scholarships', label: 'Scholarships', icon: <FiAward /> },
  { path: '/contests', label: 'Contests', icon: <FiCode /> },
  { path: '/tasks', label: 'To-Do', icon: <FiList /> },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand" onClick={() => navigate('/dashboard')}>
        <span className="brand-icon">⚡</span>
        <span className="brand-text">SAS</span>
      </div>

      <div className="sidebar-user">
        <div className="user-avatar">{user?.name?.charAt(0).toUpperCase() || 'U'}</div>
        <div className="user-info">
          <span className="user-name">{user?.name || 'User'}</span>
          <span className="user-email">{user?.email || ''}</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="nav-item logout-btn" onClick={handleLogout}>
          <span className="nav-icon"><FiLogOut /></span>
          <span className="nav-label">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
