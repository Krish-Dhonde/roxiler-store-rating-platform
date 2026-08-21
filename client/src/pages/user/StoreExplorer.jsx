import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { storeService } from '../../services/storeService';
import { useAuth } from '../../hooks/useAuth';
import { useDebounce } from '../../hooks/useDebounce';
import PageContainer from '../../components/layout/PageContainer';
import FormInput from '../../components/common/FormInput';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import StarRating from '../../components/common/StarRating';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import EmptyState from '../../components/common/EmptyState';
import RatingModal from '../../components/modals/RatingModal';
import { 
  Search, 
  Store, 
  MapPin, 
  Star, 
  UserCheck, 
  ArrowUpDown, 
  LogIn, 
  Edit3,
  ShieldCheck
} from 'lucide-react';

export default function StoreExplorer() {
  const { user, isAuthenticated } = useAuth();
  const isCustomer = isAuthenticated && user?.role === 'user';
  const isOwner = isAuthenticated && user?.role === 'owner';
  const isAdmin = isAuthenticated && user?.role === 'admin';

  const [stores, setStores] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 9, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ratingSuccessToast, setRatingSuccessToast] = useState(null);

  // Search and Sort controls
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 350);
  const [sortOption, setSortOption] = useState('rating_desc');

  // Rating Modal state
  const [selectedStoreForRating, setSelectedStoreForRating] = useState(null);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);

  const fetchStores = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      let sortBy = 'rating';
      let order = 'DESC';

      switch (sortOption) {
        case 'rating_asc':
          sortBy = 'rating';
          order = 'ASC';
          break;
        case 'name_asc':
          sortBy = 'name';
          order = 'ASC';
          break;
        case 'name_desc':
          sortBy = 'name';
          order = 'DESC';
          break;
        case 'newest':
          sortBy = 'id';
          order = 'DESC';
          break;
        case 'rating_desc':
        default:
          sortBy = 'rating';
          order = 'DESC';
          break;
      }

      const params = {
        page,
        limit: pagination.limit,
        sortBy,
        order
      };

      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }

      const data = await storeService.getStores(params);
      setStores(data.stores || []);
      setPagination(data.pagination || { total: 0, page: 1, limit: 9, totalPages: 1 });
    } catch (err) {
      setError(err.message || 'Failed to load stores.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, sortOption, pagination.limit]);

  useEffect(() => {
    fetchStores(1);
  }, [fetchStores]);

  const handlePageChange = (newPage) => {
    fetchStores(newPage);
  };

  const handleOpenRatingModal = (store) => {
    if (!isCustomer) return;
    setSelectedStoreForRating(store);
    setIsRatingModalOpen(true);
  };

  // When rating succeeds, refetch the updated store from backend to get verified aggregate calculations
  const handleRatingSuccess = async (storeId) => {
    try {
      const updatedStore = await storeService.getStoreById(storeId);
      setStores((prevStores) =>
        prevStores.map((s) => (s.id === storeId ? { ...s, ...updatedStore } : s))
      );
      setRatingSuccessToast(`Your rating for "${updatedStore.name}" was saved successfully!`);
    } catch (err) {
      console.error('Failed to sync updated store rating:', err);
      // Fallback: refetch list
      fetchStores(pagination.page);
    }
  };

  return (
    <PageContainer
      title="Explore & Rate Stores"
      subtitle="Find top-rated businesses, submit your reviews, and discover local gems"
    >
      {ratingSuccessToast && (
        <AlertMessage
          type="success"
          message={ratingSuccessToast}
          onClose={() => setRatingSuccessToast(null)}
        />
      )}

      {error && <AlertMessage type="danger" message={error} />}

      {/* Search & Sort Controls Toolbar */}
      <div className="glass-card" style={{ marginBottom: '2rem', padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ flexGrow: 1, minWidth: '260px' }}>
            <FormInput
              placeholder="Search stores by name or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={Search}
              style={{ marginBottom: 0 }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <ArrowUpDown size={14} /> Sort By:
            </span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="form-select"
              style={{ width: 'auto', minWidth: '180px' }}
            >
              <option value="rating_desc">Highest Rated</option>
              <option value="rating_asc">Lowest Rated</option>
              <option value="name_asc">Name (A to Z)</option>
              <option value="name_desc">Name (Z to A)</option>
              <option value="newest">Newest Listed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stores Grid View */}
      {loading ? (
        <LoadingSpinner text="Fetching store directory..." />
      ) : stores.length === 0 ? (
        <EmptyState
          icon={Store}
          title="No stores found"
          description={
            searchQuery
              ? `No matching stores found for "${searchQuery}". Try a different keyword.`
              : 'There are currently no stores available in the platform.'
          }
          actionText={searchQuery ? 'Clear Search' : null}
          onAction={() => setSearchQuery('')}
        />
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.75rem' }}>
            {stores.map((store) => {
              const hasMyRating = store.myRating !== null && store.myRating !== undefined;

              return (
                <div key={store.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
                  {/* Store Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                        {store.name}
                      </h3>
                      <p style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        <MapPin size={15} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '0.2rem' }} />
                        <span>{store.address}</span>
                      </p>
                    </div>
                    <Badge rating={store.overallRating} />
                  </div>

                  {/* Rating Breakdown Section */}
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid var(--border-subtle)',
                      padding: '0.85rem',
                      margin: '1rem 0 1.25rem 0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Overall Store Rating
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                        <StarRating rating={Math.round(store.overallRating)} readOnly size="sm" />
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                          {store.overallRating > 0 ? store.overallRating.toFixed(1) : 'No reviews'}
                        </span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {store.totalRatings} {store.totalRatings === 1 ? 'review' : 'reviews'}
                      </span>
                    </div>
                  </div>

                  {/* Personal Rating & Action Button */}
                  <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {/* Left side: Rating status / role indicator */}
                    <div>
                      {isCustomer ? (
                        hasMyRating ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--warning)', fontWeight: 600, fontSize: '0.875rem' }}>
                            <UserCheck size={16} />
                            Your Rating: {store.myRating} ★
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            You have not rated
                          </span>
                        )
                      ) : isOwner ? (
                        store.ownerId === user?.id ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--primary)', fontWeight: 600, fontSize: '0.85rem' }}>
                            <Store size={15} />
                            Your Store
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Customer ratings only
                          </span>
                        )
                      ) : isAdmin ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#6d28d9', fontWeight: 600, fontSize: '0.8rem' }}>
                          <ShieldCheck size={14} />
                          Admin View
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Sign in to rate
                        </span>
                      )}
                    </div>

                    {/* Right side: Action button or role badge */}
                    <div>
                      {isCustomer ? (
                        <Button
                          variant={hasMyRating ? 'outline' : 'primary'}
                          size="sm"
                          icon={hasMyRating ? Edit3 : Star}
                          onClick={() => handleOpenRatingModal(store)}
                        >
                          {hasMyRating ? 'Modify' : 'Rate Store'}
                        </Button>
                      ) : isOwner ? (
                        store.ownerId === user?.id ? (
                          <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', background: 'var(--info-bg)', color: 'var(--info)', border: '1px solid var(--info-border)', fontWeight: 600 }}>
                            Owner (Managed)
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', background: '#f1f5f9', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}>
                            Read-Only
                          </span>
                        )
                      ) : isAdmin ? (
                        <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', background: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe', fontWeight: 600 }}>
                          Read-Only
                        </span>
                      ) : (
                        <Link to="/login">
                          <Button variant="outline" size="sm" icon={LogIn}>
                            Rate
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            limit={pagination.limit}
            onPageChange={handlePageChange}
          />
        </>
      )}

      {/* Interactive Rating Modal */}
      <RatingModal
        isOpen={isRatingModalOpen}
        onClose={() => setIsRatingModalOpen(false)}
        store={selectedStoreForRating}
        onRatingSuccess={handleRatingSuccess}
      />
    </PageContainer>
  );
}
