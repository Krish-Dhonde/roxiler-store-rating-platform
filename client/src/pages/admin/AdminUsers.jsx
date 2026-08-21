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
import CreateUserModal from '../../components/modals/CreateUserModal';
import { formatDate } from '../../utils/formatters';
import { 
  Users, 
  Search, 
  Filter, 
  UserPlus, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  RotateCcw 
} from 'lucide-react';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Filter & Search states
  const [nameFilter, setNameFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [addressFilter, setAddressFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Debounced filter values to prevent excessive API requests
  const debouncedName = useDebounce(nameFilter, 350);
  const debouncedEmail = useDebounce(emailFilter, 350);
  const debouncedAddress = useDebounce(addressFilter, 350);

  // Sorting state
  const [sortBy, setSortBy] = useState('id');
  const [order, setOrder] = useState('DESC');

  // Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchUsers = useCallback(async (page = 1) => {
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
      if (roleFilter) params.role = roleFilter;

      const data = await adminService.getUsers(params);
      setUsers(data.users || []);
      setPagination(data.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 });
    } catch (err) {
      setError(err.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, [debouncedName, debouncedEmail, debouncedAddress, roleFilter, sortBy, order, pagination.limit]);

  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

  const handleSort = (field) => {
    if (sortBy === field) {
      // Toggle order
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
    setRoleFilter('');
    setSortBy('id');
    setOrder('DESC');
  };

  const handlePageChange = (newPage) => {
    fetchUsers(newPage);
  };

  const handleUserCreated = (newUser) => {
    setSuccessMessage(`User "${newUser.name}" created successfully!`);
    fetchUsers(1);
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return <ArrowUpDown size={14} style={{ opacity: 0.4 }} />;
    return order === 'ASC' ? <ArrowUp size={14} style={{ color: 'var(--primary)' }} /> : <ArrowDown size={14} style={{ color: 'var(--primary)' }} />;
  };

  return (
    <PageContainer
      title="User Management"
      subtitle="View, search, sort, and register accounts across all platform roles"
      actions={
        <Button
          variant="primary"
          icon={UserPlus}
          onClick={() => setIsCreateModalOpen(true)}
        >
          Add New User
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
          <FormInput
            label="Search Name"
            placeholder="Filter by name..."
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            icon={Search}
            style={{ marginBottom: 0 }}
          />

          <FormInput
            label="Search Email"
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

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Role Filter</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="form-select"
            >
              <option value="">All Roles</option>
              <option value="user">Customer (User)</option>
              <option value="owner">Store Owner</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

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

      {/* Users Data Table */}
      {loading ? (
        <LoadingSpinner text="Loading user directory..." />
      ) : users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users match your criteria"
          description="Try modifying or resetting your search filters."
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
                      <span>Name</span>
                      {getSortIcon('name')}
                    </button>
                  </th>
                  <th>
                    <button className="table-header-btn" onClick={() => handleSort('email')}>
                      <span>Email</span>
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
                    <button className="table-header-btn" onClick={() => handleSort('role')}>
                      <span>Role</span>
                      {getSortIcon('role')}
                    </button>
                  </th>
                  <th>
                    <button className="table-header-btn" onClick={() => handleSort('createdAt')}>
                      <span>Joined</span>
                      {getSortIcon('createdAt')}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID #{u.id}</span>
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-secondary)' }}>{u.email}</span>
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-secondary)', maxWidth: '280px', display: 'inline-block' }}>
                        {u.address}
                      </span>
                    </td>
                    <td>
                      <Badge role={u.role} />
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {formatDate(u.createdAt)}
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

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onUserCreated={handleUserCreated}
      />
    </PageContainer>
  );
}
