import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import PageContainer from '../../components/layout/PageContainer';
import Button from '../../components/common/Button';
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react';

export default function Unauthorized() {
  const { user } = useAuth();

  const getHomePath = () => {
    switch (user?.role) {
      case 'admin': return '/admin/dashboard';
      case 'owner': return '/owner/dashboard';
      case 'user':
      default: return '/stores';
    }
  };

  return (
    <PageContainer>
      <div style={{ maxWidth: '32rem', margin: '3rem auto', textAlign: 'center' }}>
        <div className="glass-card" style={{ padding: '3rem 2rem' }}>
          <div
            style={{
              width: '4.5rem',
              height: '4.5rem',
              borderRadius: '50%',
              background: 'var(--danger-bg)',
              border: '1px solid var(--danger-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem auto',
              color: 'var(--danger)'
            }}
          >
            <ShieldAlert size={36} />
          </div>

          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>403 — Access Forbidden</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.75rem', fontSize: '0.95rem' }}>
            You do not have permission to view this resource. Your current role is{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{user?.role || 'guest'}</strong>.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link to={getHomePath()}>
              <Button variant="primary" icon={Home}>
                Go to Dashboard
              </Button>
            </Link>
            <Link to="/stores">
              <Button variant="secondary" icon={ArrowLeft}>
                Browse Stores
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
