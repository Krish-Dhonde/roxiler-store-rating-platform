import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import PageContainer from '../../components/layout/PageContainer';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { formatDate, getRoleDisplayName } from '../../utils/formatters';
import { User, Mail, MapPin, Shield, Calendar, Key, ShieldCheck } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();

  return (
    <PageContainer
      title="User Profile"
      subtitle="View your account details, access roles, and security settings"
      actions={
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link to="/change-password" style={{ textDecoration: 'none' }}>
            <Button variant="primary" icon={Key} size="sm">
              Change Password
            </Button>
          </Link>
        </div>
      }
    >
      <div style={{ maxWidth: '44rem' }}>
        <div className="glass-card">
          {/* User Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <div
              style={{
                width: '4rem',
                height: '4rem',
                background: 'var(--primary)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 700,
                flexShrink: 0
              }}
            >
              {user?.name ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() : 'U'}
            </div>

            <div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
                {user?.name}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <Badge role={user?.role} />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Account ID #{user?.id}</span>
              </div>
            </div>
          </div>

          {/* Profile Details Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
              <Mail size={18} style={{ color: 'var(--primary)', marginTop: '0.2rem', flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                  Email Address
                </p>
                <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.15rem' }}>{user?.email}</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
              <ShieldCheck size={18} style={{ color: 'var(--primary)', marginTop: '0.2rem', flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                  Account Role
                </p>
                <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.15rem' }}>
                  {getRoleDisplayName(user?.role)} (<code>{user?.role}</code>)
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
              <MapPin size={18} style={{ color: 'var(--primary)', marginTop: '0.2rem', flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                  Registered Address
                </p>
                <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.15rem' }}>{user?.address || '—'}</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
              <Calendar size={18} style={{ color: 'var(--primary)', marginTop: '0.2rem', flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                  Member Since
                </p>
                <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.15rem' }}>{formatDate(user?.created_at || user?.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Quick Action Footer */}
          <div style={{ marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Need to update your password credentials?
            </span>
            <Link to="/change-password" style={{ textDecoration: 'none' }}>
              <Button variant="outline" size="sm" icon={Key}>
                Update Password
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
