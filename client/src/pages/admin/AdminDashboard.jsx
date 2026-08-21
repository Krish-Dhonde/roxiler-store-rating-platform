import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import PageContainer from '../../components/layout/PageContainer';
import StatCard from '../../components/common/StatCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import Button from '../../components/common/Button';
import { Users, Store, Star, ArrowRight, UserPlus, PlusCircle, ShieldCheck, RotateCcw } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getDashboardStats();
      setStats(data);
    } catch (err) {
      setError(err.message || 'Failed to load platform statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <PageContainer
      title="System Administration Dashboard"
      subtitle="Comprehensive metrics and platform control center"
      actions={
        <Button variant="secondary" size="sm" icon={RotateCcw} onClick={loadStats} disabled={loading}>
          Refresh Metrics
        </Button>
      }
    >
      {error && <AlertMessage type="danger" message={error} />}

      {loading ? (
        <LoadingSpinner text="Fetching platform analytics..." />
      ) : (
        <>
          {/* Key Metrics Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
            <StatCard
              title="Total Users"
              value={stats?.totalUsers ?? 0}
              icon={Users}
              color="primary"
              subtitle="Registered platform accounts"
            />
            <StatCard
              title="Registered Stores"
              value={stats?.totalStores ?? 0}
              icon={Store}
              color="purple"
              subtitle="Active merchant listings"
            />
            <StatCard
              title="Submitted Ratings"
              value={stats?.totalRatings ?? 0}
              icon={Star}
              color="amber"
              subtitle="Total verified customer reviews"
            />
          </div>

          {/* Quick Management Shortcuts */}
          <div style={{ marginBottom: '2.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Management & Controls</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <Users size={22} style={{ color: 'var(--primary)' }} />
                  <h4 style={{ fontSize: '1.15rem' }}>User Management</h4>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', flexGrow: 1 }}>
                  View, filter, sort, and create user accounts with any role (Customer, Store Owner, Administrator).
                </p>
                <Link to="/admin/users">
                  <Button variant="primary" icon={ArrowRight} block>
                    Manage Users
                  </Button>
                </Link>
              </div>

              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <Store size={22} style={{ color: 'var(--accent-purple)' }} />
                  <h4 style={{ fontSize: '1.15rem' }}>Store Management</h4>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', flexGrow: 1 }}>
                  Explore all registered merchant stores, inspect calculated ratings, and register new store listings with assigned owners.
                </p>
                <Link to="/admin/stores">
                  <Button variant="primary" icon={ArrowRight} block>
                    Manage Stores
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* System Security Notice */}
          <div className="glass-card" style={{ borderLeft: '4px solid var(--success)', background: 'rgba(16, 185, 129, 0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
              <ShieldCheck size={24} style={{ color: 'var(--success)', flexShrink: 0, marginTop: '0.1rem' }} />
              <div>
                <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.35rem' }}>Administrator Authorization Verified</h4>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  All administrative data operations are cryptographically verified by the backend Express RBAC engine using MySQL prepared statements and column-whitelisted sorting.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </PageContainer>
  );
}
