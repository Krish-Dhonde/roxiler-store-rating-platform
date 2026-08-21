import React from 'react';
import { Link } from 'react-router-dom';
import PageContainer from '../../components/layout/PageContainer';
import Button from '../../components/common/Button';
import { Compass, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <PageContainer>
      <div style={{ maxWidth: '32rem', margin: '3rem auto', textAlign: 'center' }}>
        <div className="glass-card" style={{ padding: '3rem 2rem' }}>
          <div
            style={{
              width: '4.5rem',
              height: '4.5rem',
              borderRadius: '50%',
              background: 'var(--info-bg)',
              border: '1px solid var(--info-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem auto',
              color: 'var(--info)'
            }}
          >
            <Compass size={36} />
          </div>

          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>404 — Page Not Found</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.75rem', fontSize: '0.95rem' }}>
            The page you are looking for doesn't exist or has been moved.
          </p>

          <Link to="/">
            <Button variant="primary" icon={Home}>
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
