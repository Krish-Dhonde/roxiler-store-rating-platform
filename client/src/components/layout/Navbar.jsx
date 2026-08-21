import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { 
  Store, 
  LayoutDashboard, 
  Star, 
  User, 
  Users,
  LogOut, 
  Key, 
  Menu, 
  X, 
  ShieldCheck 
} from 'lucide-react';
import Badge from '../common/Badge';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Brand Logo */}
        <Link to="/" className="navbar-brand">
          <div className="brand-icon-box">
            <Store size={20} />
          </div>
          <span>Roxiler</span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="navbar-links">
          {/* Public Store Directory */}
          <NavLink to="/stores" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Store size={16} />
            <span>Stores</span>
          </NavLink>

          {/* Admin Navigation */}
          {isAuthenticated && user?.role === 'admin' && (
            <>
              <NavLink to="/admin/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <LayoutDashboard size={16} />
                <span>Dashboard</span>
              </NavLink>
              <NavLink to="/admin/users" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Users size={16} />
                <span>Users</span>
              </NavLink>
              <NavLink to="/admin/stores" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Store size={16} />
                <span>Store Registry</span>
              </NavLink>
            </>
          )}

          {/* Store Owner Navigation */}
          {isAuthenticated && user?.role === 'owner' && (
            <NavLink to="/owner/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={16} />
              <span>Owner Dashboard</span>
            </NavLink>
          )}

          {/* Customer Navigation */}
          {isAuthenticated && user?.role === 'user' && (
            <NavLink to="/user/ratings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Star size={16} />
              <span>My Ratings</span>
            </NavLink>
          )}
        </div>

        {/* User Actions / Auth Buttons */}
        <div className="navbar-actions">
          {isAuthenticated ? (
            <div style={{ position: 'relative' }}>
              <button
                className="user-menu-trigger"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                aria-expanded={userDropdownOpen}
              >
                <div className="user-avatar-circle">{getInitials(user?.name)}</div>
                <span>{user?.name?.split(' ')[0]}</span>
                <Badge role={user?.role} />
              </button>

              {/* Profile Dropdown Menu */}
              {userDropdownOpen && (
                <>
                  <div
                    style={{ position: 'fixed', inset: 0, zIndex: 90 }}
                    onClick={() => setUserDropdownOpen(false)}
                  />
                  <div
                    className="glass-card"
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 'calc(100% + 0.5rem)',
                      width: '15rem',
                      padding: '0.75rem',
                      zIndex: 100
                    }}
                  >
                    <div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '0.5rem' }}>
                      <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user?.name}</p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user?.email}</p>
                    </div>

                    <Link
                      to="/profile"
                      className="nav-link"
                      onClick={() => setUserDropdownOpen(false)}
                      style={{ width: '100%' }}
                    >
                      <User size={16} />
                      <span>Profile</span>
                    </Link>

                    <Link
                      to="/change-password"
                      className="nav-link"
                      onClick={() => setUserDropdownOpen(false)}
                      style={{ width: '100%' }}
                    >
                      <Key size={16} />
                      <span>Change Password</span>
                    </Link>

                    <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: '0.5rem', paddingTop: '0.5rem' }}>
                      <button
                        onClick={handleLogout}
                        className="nav-link"
                        style={{ width: '100%', background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                      >
                        <LogOut size={16} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link to="/login" className="btn btn-outline btn-sm">
                Log In
              </Link>
              <Link to="/signup" className="btn btn-primary btn-sm">
                Sign Up
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            className="mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          className="glass-card"
          style={{
            position: 'absolute',
            top: '4.25rem',
            left: 0,
            right: 0,
            borderTop: 'none',
            borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            padding: '1.25rem',
            zIndex: 99
          }}
        >
          <NavLink
            to="/stores"
            className="nav-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Store size={16} />
            <span>Stores</span>
          </NavLink>

          {isAuthenticated && user?.role === 'admin' && (
            <>
              <NavLink
                to="/admin/dashboard"
                className="nav-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                <LayoutDashboard size={16} />
                <span>Admin Dashboard</span>
              </NavLink>
              <NavLink
                to="/admin/users"
                className="nav-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Users size={16} />
                <span>Manage Users</span>
              </NavLink>
              <NavLink
                to="/admin/stores"
                className="nav-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Store size={16} />
                <span>Manage Stores</span>
              </NavLink>
            </>
          )}

          {isAuthenticated && user?.role === 'owner' && (
            <NavLink
              to="/owner/dashboard"
              className="nav-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              <LayoutDashboard size={16} />
              <span>Owner Dashboard</span>
            </NavLink>
          )}

          {isAuthenticated && user?.role === 'user' && (
            <NavLink
              to="/user/ratings"
              className="nav-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Star size={16} />
              <span>My Ratings</span>
            </NavLink>
          )}

          {isAuthenticated ? (
            <>
              <NavLink
                to="/profile"
                className="nav-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                <User size={16} />
                <span>Profile</span>
              </NavLink>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="nav-link"
                style={{ background: 'none', border: 'none', color: 'var(--danger)', textAlign: 'left', width: '100%' }}
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
              <Link to="/login" className="btn btn-outline btn-block" onClick={() => setMobileMenuOpen(false)}>
                Log In
              </Link>
              <Link to="/signup" className="btn btn-primary btn-block" onClick={() => setMobileMenuOpen(false)}>
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
