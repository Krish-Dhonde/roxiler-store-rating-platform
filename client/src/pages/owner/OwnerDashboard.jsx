import React, { useState, useEffect } from 'react';
import { ownerService } from '../../services/ownerService';
import PageContainer from '../../components/layout/PageContainer';
import StatCard from '../../components/common/StatCard';
import StarRating from '../../components/common/StarRating';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import StoreReviewsTable from '../../components/owner/StoreReviewsTable';
import AddStoreModal from '../../components/modals/AddStoreModal';
import { 
  Store, 
  Star, 
  MapPin, 
  Mail, 
  MessageSquare, 
  Calendar,
  RotateCcw,
  PlusCircle,
  Table,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff
} from 'lucide-react';

export default function OwnerDashboard() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  // Modal State for adding new store location
  const [isAddStoreModalOpen, setIsAddStoreModalOpen] = useState(false);

  // Track expanded detail tables for each store
  const [expandedStoreIds, setExpandedStoreIds] = useState({});

  const loadOwnerStores = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ownerService.getOwnerStores();
      setStores(data || []);
      
      // Auto-expand first store by default if available
      if (data && data.length > 0) {
        setExpandedStoreIds((prev) => ({
          ...prev,
          [data[0].id]: true
        }));
      }
    } catch (err) {
      setError(err.message || 'Failed to load your store listings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOwnerStores();
  }, []);

  const toggleStoreDetails = (storeId) => {
    setExpandedStoreIds((prev) => ({
      ...prev,
      [storeId]: !prev[storeId]
    }));
  };

  const handleStoreCreated = (newStore) => {
    setSuccessMessage(`Store "${newStore.name}" registered successfully!`);
    loadOwnerStores();
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  // Compute aggregate stats across owner's stores
  const totalStoresCount = stores.length;
  const totalReviewsCount = stores.reduce((acc, s) => acc + (s.totalRatings || 0), 0);
  const aggregateAverage =
    totalStoresCount > 0 && totalReviewsCount > 0
      ? (
          stores.reduce((acc, s) => acc + (s.averageRating || 0) * (s.totalRatings || 0), 0) /
          totalReviewsCount
        ).toFixed(2)
      : '0.00';

  return (
    <PageContainer
      title="Store Owner Dashboard"
      subtitle="Monitor your store performance, review customer ratings, and analyze feedback"
      actions={
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Button 
            variant="secondary" 
            size="sm" 
            icon={RotateCcw} 
            onClick={loadOwnerStores} 
            disabled={loading}
          >
            Refresh
          </Button>
          <Button 
            variant="primary" 
            size="sm" 
            icon={PlusCircle} 
            onClick={() => setIsAddStoreModalOpen(true)}
          >
            Add New Store
          </Button>
        </div>
      }
    >
      {successMessage && <AlertMessage type="success" message={successMessage} />}
      {error && <AlertMessage type="danger" message={error} />}

      {loading ? (
        <LoadingSpinner text="Fetching your stores and customer analytics..." />
      ) : stores.length === 0 ? (
        <div style={{ background: '#ffffff', border: '1px solid var(--border-subtle)', padding: '2.5rem', textAlign: 'center' }}>
          <EmptyState
            icon={Store}
            title="No Stores Registered Yet"
            description="You have not registered any store locations under your owner account yet. Click below to add your first store location."
            actionLabel="Register First Store"
            actionIcon={PlusCircle}
            onAction={() => setIsAddStoreModalOpen(true)}
          />
        </div>
      ) : (
        <>
          {/* Owner Aggregate Summary Stat Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
            <StatCard
              title="My Stores"
              value={totalStoresCount}
              icon={Store}
              color="purple"
              subtitle="Registered store locations"
            />
            <StatCard
              title="Total Customer Reviews"
              value={totalReviewsCount}
              icon={MessageSquare}
              color="primary"
              subtitle="Across all your stores"
            />
            <StatCard
              title="Overall Portfolio Average"
              value={`${aggregateAverage} ★`}
              icon={Star}
              color="amber"
              subtitle="Weighted customer satisfaction"
            />
          </div>

          {/* Stores & Customer Feedback Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {stores.map((store) => {
              const isExpanded = Boolean(expandedStoreIds[store.id]);
              const reviewCount = store.ratings ? store.ratings.length : (store.totalRatings || 0);

              return (
                <div 
                  key={store.id} 
                  className="glass-card" 
                  style={{ 
                    padding: '2rem',
                    border: isExpanded ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  {/* Store Header & Summary Info */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                        <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', margin: 0 }}>
                          {store.name}
                        </h2>
                        <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.55rem', background: 'var(--info-bg)', color: 'var(--info)', border: '1px solid var(--info-border)', fontWeight: 600 }}>
                          Store #{store.id}
                        </span>
                      </div>
                      <p style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0.25rem 0' }}>
                        <MapPin size={15} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                        <span>{store.address}</span>
                      </p>
                      <p style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                        <Mail size={14} />
                        <span>{store.email}</span>
                      </p>
                    </div>

                    {/* Store Rating Snapshot & Details Toggle Action */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <StarRating rating={Math.round(store.averageRating)} readOnly size="md" />
                        <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--warning)' }}>
                          {store.averageRating > 0 ? Number(store.averageRating).toFixed(1) : '0.0'} ★
                        </span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: '0.25rem' }}>
                          ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
                        </span>
                      </div>

                      {/* Button to toggle customer ratings in tabular form */}
                      <Button
                        variant={isExpanded ? 'primary' : 'outline'}
                        size="sm"
                        icon={isExpanded ? ChevronUp : Table}
                        onClick={() => toggleStoreDetails(store.id)}
                      >
                        {isExpanded ? 'Hide Customer Ratings' : `View Customer Ratings (${reviewCount})`}
                      </Button>
                    </div>
                  </div>

                  {/* Expandable Tabular View of Customer Ratings */}
                  {isExpanded && (
                    <StoreReviewsTable 
                      store={store} 
                      reviews={store.ratings || []} 
                    />
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Modal for adding a new store */}
      <AddStoreModal
        isOpen={isAddStoreModalOpen}
        onClose={() => setIsAddStoreModalOpen(false)}
        onStoreCreated={handleStoreCreated}
      />
    </PageContainer>
  );
}
