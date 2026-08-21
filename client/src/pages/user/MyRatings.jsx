import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { storeService } from '../../services/storeService';
import PageContainer from '../../components/layout/PageContainer';
import StarRating from '../../components/common/StarRating';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import EmptyState from '../../components/common/EmptyState';
import RatingModal from '../../components/modals/RatingModal';
import { Star, Store, MapPin, Edit3 } from 'lucide-react';

export default function MyRatings() {
  const [ratedStores, setRatedStores] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 9, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Rating Modal state
  const [selectedStoreForModify, setSelectedStoreForModify] = useState(null);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);

  const fetchRatedStores = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      // Scalable Server-Side Query: retrieves exclusively stores rated by current user
      const data = await storeService.getStores({
        ratedOnly: true,
        page,
        limit: pagination.limit,
        sortBy: 'id',
        order: 'DESC'
      });

      setRatedStores(data.stores || []);
      setPagination(data.pagination || { total: 0, page: 1, limit: 9, totalPages: 1 });
    } catch (err) {
      setError(err.message || 'Failed to load your submitted ratings.');
    } finally {
      setLoading(false);
    }
  }, [pagination.limit]);

  useEffect(() => {
    fetchRatedStores(1);
  }, [fetchRatedStores]);

  const handleOpenModifyModal = (store) => {
    setSelectedStoreForModify(store);
    setIsRatingModalOpen(true);
  };

  const handleRatingSuccess = async (storeId, newRating) => {
    setToastMessage(`Your rating was updated to ${newRating} ★!`);
    // Refetch the updated rating list
    fetchRatedStores(pagination.page);
  };

  return (
    <PageContainer
      title="My Submitted Ratings"
      subtitle="Review and manage all stores you have rated on the platform"
      actions={
        <Link to="/stores">
          <Button variant="secondary" icon={Store} size="sm">
            Browse More Stores
          </Button>
        </Link>
      }
    >
      {toastMessage && (
        <AlertMessage
          type="success"
          message={toastMessage}
          onClose={() => setToastMessage(null)}
        />
      )}

      {error && <AlertMessage type="danger" message={error} />}

      {loading ? (
        <LoadingSpinner text="Loading your reviewed stores..." />
      ) : ratedStores.length === 0 ? (
        <EmptyState
          icon={Star}
          title="No submitted ratings found"
          description="You haven't rated any stores yet. Browse the store directory to share your feedback!"
          actionText="Browse Stores Directory"
          onAction={() => {}}
        />
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.75rem' }}>
            {ratedStores.map((store) => (
              <div key={store.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>{store.name}</h3>
                  <Badge rating={store.overallRating} />
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                  <MapPin size={15} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '0.15rem' }} />
                  <span>{store.address}</span>
                </div>

                {/* Your Rating Banner */}
                <div
                  style={{
                    background: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem'
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--warning)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Your Submitted Rating
                    </span>
                    <div style={{ marginTop: '0.2rem' }}>
                      <StarRating rating={Number(store.myRating)} readOnly size="sm" showLabel />
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    icon={Edit3}
                    onClick={() => handleOpenModifyModal(store)}
                  >
                    Modify
                  </Button>
                </div>

                {/* Overall Store Metrics */}
                <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span>Overall Average: {store.overallRating > 0 ? `${store.overallRating.toFixed(1)} ★` : 'No ratings'}</span>
                  <span>{store.totalRatings} total reviews</span>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            limit={pagination.limit}
            onPageChange={(p) => fetchRatedStores(p)}
          />
        </>
      )}

      {/* Rating Modification Modal */}
      <RatingModal
        isOpen={isRatingModalOpen}
        onClose={() => setIsRatingModalOpen(false)}
        store={selectedStoreForModify}
        onRatingSuccess={handleRatingSuccess}
      />
    </PageContainer>
  );
}
