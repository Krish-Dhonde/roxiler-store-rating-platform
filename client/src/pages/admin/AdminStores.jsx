import React, { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../services/adminService';
import { useDebounce } from '../../hooks/useDebounce';
import PageContainer from '../../components/layout/PageContainer';
import FormInput from '../../components/common/FormInput';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import EmptyState from '../../components/common/EmptyState';
import CreateStoreModal from '../../components/modals/CreateStoreModal';
import { formatDate } from '../../utils/formatters';
import { 
  Store, 
  Search, 
  PlusCircle, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  RotateCcw,
  User 
} from 'lucide-react';

export default function AdminStores() {
  const [stores, setStores] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Search & Filter states
  const [nameFilter, setNameFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [addressFilter, setAddressFilter] = useState('');

  // Debounce search values
  const debouncedName = useDebounce(nameFilter, 350);
  const debouncedEmail = useDebounce(emailFilter, 350);
  const debouncedAddress = useDebounce(addressFilter, 350);

  // Sorting state
  const [sortBy, setSortBy] = useState('id');
  const [order, setOrder] = useState('DESC');

  // Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchStores = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page,
        limit: pagination.limit,
        sortBy,
        order
      };

      if (debouncedName.trim()) params.name = debouncedName.trim();
      if (debouncedEmail.trim()) params.email = debouncedEmail.trim();
      if (debouncedAddress.trim()) params.address = debouncedAddress.trim();

      const data = await adminService.getStores(params);
      setStores(data.stores || []);
      setPagination(data.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 });
    } catch (err) {
      setError(err.message || 'Failed to load stores.');
    } finally {
      setLoading(false);
    }
  }, [debouncedName, debouncedEmail, debouncedAddress, sortBy, order, pagination.limit]);

  useEffect(() => {
    fetchStores(1);
  }, [fetchStores]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setOrder(order === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setOrder('ASC');
    }
  };

  const handleResetFilters = () => {
    setNameFilter('');
    setEmailFilter('');
    setAddressFilter('');
    setSortBy('id');
    setOrder('DESC');
  };

  const handlePageChange = (newPage) => {
    fetchStores(newPage);
  };

  const handleStoreCreated = (newStore) => {
    setSuccessMessage(`Store "${newStore.name}" created successfully!`);
    fetchStores(1);
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return <ArrowUpDown size={14} style={{ opacity: 0.4 }} />;
    return order === 'ASC' ? <ArrowUp size={14} style={{ color: 'var(--primary)' }} /> : <ArrowDown size={14} style={{ color: 'var(--primary)' }} />;
  };

  return (
    <PageContainer
      title="Store Management"
      subtitle="Register merchant stores, inspect rating analytics, and manage owner assignments"
      actions={
        <Button
          variant="primary"
          icon={PlusCircle}
          onClick={() => setIsCreateModalOpen(true)}
        >
          Register New Store
        </Button>
      }
    >
      {successMessage && (
        <AlertMessage
          type="success"
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
        />
      )}

      {error && <AlertMessage type="danger" message={error} />}

      {/* Filter & Search Toolbar */}
      <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
          <FormInput
            label="Search Store Name"
            placeholder="Filter by store name..."
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            icon={Search}
            style={{ marginBottom: 0 }}
          />

          <FormInput
            label="Search Store Email"
            placeholder="Filter by email..."
            value={emailFilter}
            onChange={(e) => setEmailFilter(e.target.value)}
            icon={Search}
            style={{ marginBottom: 0 }}
          />

          <FormInput
            label="Search Address"
            placeholder="Filter by address..."
            value={addressFilter}
            onChange={(e) => setAddressFilter(e.target.value)}
            icon={Search}
            style={{ marginBottom: 0 }}
          />

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button
              variant="secondary"
              icon={RotateCcw}
              onClick={handleResetFilters}
              size="md"
              style={{ flexGrow: 1 }}
            >
              Reset Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Stores Data Table */}
      {loading ? (
        <LoadingSpinner text="Loading stores list..." />
      ) : stores.length === 0 ? (
        <EmptyState
          icon={Store}
          title="No stores found"
          description="Try modifying your search criteria or register a new store."
          actionText="Reset Filters"
          onAction={handleResetFilters}
        />
      ) : (
        <>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>
                    <button className="table-header-btn" onClick={() => handleSort('name')}>
                      <span>Store Name</span>
                      {getSortIcon('name')}
                    </button>
                  </th>
                  <th>
                    <button className="table-header-btn" onClick={() => handleSort('email')}>
                      <span>Contact Email</span>
                      {getSortIcon('email')}
                    </button>
                  </th>
                  <th>
                    <button className="table-header-btn" onClick={() => handleSort('address')}>
                      <span>Address</span>
                      {getSortIcon('address')}
                    </button>
                  </th>
                  <th>
                    <span>Assigned Owner</span>
                  </th>
                  <th>
                    <button className="table-header-btn" onClick={() => handleSort('rating')}>
                      <span>Overall Rating</span>
                      {getSortIcon('rating')}
                    </button>
                  </th>
                  <th>
                    <button className="table-header-btn" onClick={() => handleSort('totalRatings')}>
                      <span>Total Reviews</span>
                      {getSortIcon('totalRatings')}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {stores.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID #{s.id}</span>
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-secondary)' }}>{s.email}</span>
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-secondary)', maxWidth: '250px', display: 'inline-block' }}>
                        {s.address}
                      </span>
                    </td>
                    <td>
                      {s.ownerName ? (
                        <div>
                          <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <User size={13} style={{ color: 'var(--primary)' }} />
                            <span>{s.ownerName}</span>
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.ownerEmail}</span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem' }}>
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td>
                      <Badge rating={s.overallRating} />
                    </td>
                    <td>
                      <span style={{ fontWeight: 500 }}>
                        {s.totalRatings} {s.totalRatings === 1 ? 'review' : 'reviews'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

      {/* Create Store Modal */}
      <CreateStoreModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onStoreCreated={handleStoreCreated}
      />
    </PageContainer>
  );
}
