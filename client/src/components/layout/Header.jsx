import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Badge from '../common/Badge';
import { 
  Menu, 
  User, 
  Key, 
  LogOut, 
  ChevronDown,
  ShieldCheck
} from 'lucide-react';

export default function Header({ onToggleMobile }) {
  const { user, isAuthenticated, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    setDropdownOpen(false);
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
    <header className="app-header">
      {/* Mobile Toggle Button */}
      <div className="header-left">
        <button
          className="mobile-toggle"
          onClick={onToggleMobile}
          aria-label="Open navigation sidebar"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Right Header Action Area */}
      <div className="header-right">
        {isAuthenticated ? (
          <div style={{ position: 'relative' }}>
            <button
              className="user-menu-trigger"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              aria-expanded={dropdownOpen}
            >
              <div className="user-avatar-circle">{getInitials(user?.name)}</div>
              <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {user?.name?.split(' ')[0]}
                </span>
              </div>
              <Badge role={user?.role} />
              <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
            </button>

            {/* Profile Dropdown Menu */}
            {dropdownOpen && (
              <>
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 99 }}
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="user-dropdown-menu">
                  <div className="user-dropdown-header">
                    <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                      {user?.name}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {user?.email}
                    </p>
                  </div>

                  <Link
                    to="/profile"
                    className="user-dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <User size={15} />
                    <span>My Profile</span>
                  </Link>

                  <Link
                    to="/change-password"
                    className="user-dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <Key size={15} />
                    <span>Change Password</span>
                  </Link>

                  <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: '0.35rem', paddingTop: '0.35rem' }}>
                    <button
                      onClick={handleLogout}
                      className="user-dropdown-item danger"
                    >
                      <LogOut size={15} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Link to="/login" className="btn btn-outline btn-sm">
              Sign In
            </Link>
            <Link to="/signup" className="btn btn-primary btn-sm">
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
