import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { 
  Store, 
  LayoutDashboard, 
  Star, 
  Users, 
  User, 
  Key, 
  LogIn, 
  UserPlus, 
  X,
  ShieldCheck,
  Building2
} from 'lucide-react';

export default function Sidebar({ mobileOpen, onCloseMobile }) {
  const { user, isAuthenticated } = useAuth();

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.4)',
            zIndex: 95
          }}
        />
      )}

      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-header">
          <Link to="/" className="sidebar-brand" onClick={onCloseMobile}>
            <div className="brand-icon-box">
              <Store size={20} />
            </div>
            <span>Roxiler</span>
          </Link>

          {mobileOpen && (
            <button
              onClick={onCloseMobile}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '0.25rem'
              }}
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Stacked Navigation Links */}
        <nav className="sidebar-nav">
          <div className="sidebar-section-title">Directory</div>
          <NavLink
            to="/stores"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onCloseMobile}
          >
            <Store size={18} />
            <span>Stores Directory</span>
          </NavLink>

          {/* Admin Navigation Section */}
          {isAuthenticated && user?.role === 'admin' && (
            <>
              <div className="sidebar-section-title">Administration</div>
              <NavLink
                to="/admin/dashboard"
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={onCloseMobile}
              >
                <LayoutDashboard size={18} />
                <span>Dashboard Overview</span>
              </NavLink>
              <NavLink
                to="/admin/users"
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={onCloseMobile}
              >
                <Users size={18} />
                <span>Manage Users</span>
              </NavLink>
              <NavLink
                to="/admin/stores"
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={onCloseMobile}
              >
                <Building2 size={18} />
                <span>Store Registry</span>
              </NavLink>
            </>
          )}

          {/* Store Owner Navigation Section */}
          {isAuthenticated && user?.role === 'owner' && (
            <>
              <div className="sidebar-section-title">Store Management</div>
              <NavLink
                to="/owner/dashboard"
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={onCloseMobile}
              >
                <LayoutDashboard size={18} />
                <span>Owner Dashboard</span>
              </NavLink>
            </>
          )}

          {/* Customer Navigation Section */}
          {isAuthenticated && user?.role === 'user' && (
            <>
              <div className="sidebar-section-title">Customer Area</div>
              <NavLink
                to="/user/ratings"
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={onCloseMobile}
              >
                <Star size={18} />
                <span>My Ratings</span>
              </NavLink>
            </>
          )}

          {/* Account Section */}
          {isAuthenticated ? (
            <>
              <div className="sidebar-section-title">Account Settings</div>
              <NavLink
                to="/profile"
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={onCloseMobile}
              >
                <User size={18} />
                <span>My Profile</span>
              </NavLink>
              <NavLink
                to="/change-password"
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={onCloseMobile}
              >
                <Key size={18} />
                <span>Change Password</span>
              </NavLink>
            </>
          ) : (
            <>
              <div className="sidebar-section-title">Authentication</div>
              <NavLink
                to="/login"
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={onCloseMobile}
              >
                <LogIn size={18} />
                <span>Sign In</span>
              </NavLink>
              <NavLink
                to="/signup"
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={onCloseMobile}
              >
                <UserPlus size={18} />
                <span>Customer Sign Up</span>
              </NavLink>
              <NavLink
                to="/register-store"
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={onCloseMobile}
              >
                <Building2 size={18} />
                <span>Register Store</span>
              </NavLink>
            </>
          )}
        </nav>
      </aside>
    </>
  );
}
