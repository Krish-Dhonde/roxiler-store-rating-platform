import React, { useState, useMemo } from 'react';
import StarRating from '../common/StarRating';
import FormInput from '../common/FormInput';
import Button from '../common/Button';
import Pagination from '../common/Pagination';
import EmptyState from '../common/EmptyState';
import { formatDate } from '../../utils/formatters';
import { 
  Search, 
  Mail, 
  Star, 
  Calendar, 
  User, 
  RotateCcw, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  Filter
} from 'lucide-react';

export default function StoreReviewsTable({ store, reviews = [] }) {
  // Filter States
  const [nameFilter, setNameFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');

  // Sorting States
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('DESC');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Handle Sort toggling
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortField(field);
      setSortOrder('ASC');
    }
    setCurrentPage(1);
  };

  // Reset all filters to default
  const handleResetFilters = () => {
    setNameFilter('');
    setEmailFilter('');
    setRatingFilter('all');
    setSortField('createdAt');
    setSortOrder('DESC');
    setCurrentPage(1);
  };

  const isFiltered = nameFilter.trim() !== '' || emailFilter.trim() !== '' || ratingFilter !== 'all';

  // Compute rating breakdown distribution
  const ratingDistribution = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const score = Math.round(Number(r.rating) || 0);
      if (counts[score] !== undefined) {
        counts[score] += 1;
      }
    });
    return counts;
  }, [reviews]);

  // Filtered and sorted dataset
  const filteredAndSortedReviews = useMemo(() => {
    return reviews
      .filter((r) => {
        // Name filter
        if (nameFilter.trim()) {
          const userName = (r.user?.name || '').toLowerCase();
          if (!userName.includes(nameFilter.trim().toLowerCase())) {
            return false;
          }
        }

        // Email filter
        if (emailFilter.trim()) {
          const userEmail = (r.user?.email || '').toLowerCase();
          if (!userEmail.includes(emailFilter.trim().toLowerCase())) {
            return false;
          }
        }

        // Star rating filter
        if (ratingFilter !== 'all') {
          const expectedRating = Number(ratingFilter);
          if (Math.round(Number(r.rating)) !== expectedRating) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        let valA, valB;

        switch (sortField) {
          case 'name':
            valA = (a.user?.name || '').toLowerCase();
            valB = (b.user?.name || '').toLowerCase();
            return sortOrder === 'ASC' ? valA.localeCompare(valB) : valB.localeCompare(valA);

          case 'email':
            valA = (a.user?.email || '').toLowerCase();
            valB = (b.user?.email || '').toLowerCase();
            return sortOrder === 'ASC' ? valA.localeCompare(valB) : valB.localeCompare(valA);

          case 'rating':
            valA = Number(a.rating) || 0;
            valB = Number(b.rating) || 0;
            return sortOrder === 'ASC' ? valA - valB : valB - valA;

          case 'createdAt':
          default:
            valA = new Date(a.createdAt || 0).getTime();
            valB = new Date(b.createdAt || 0).getTime();
            return sortOrder === 'ASC' ? valA - valB : valB - valA;
        }
      });
  }, [reviews, nameFilter, emailFilter, ratingFilter, sortField, sortOrder]);

  // Paginated slice
  const totalItems = filteredAndSortedReviews.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedReviews = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedReviews.slice(start, start + itemsPerPage);
  }, [filteredAndSortedReviews, currentPage, itemsPerPage]);

  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown size={14} style={{ opacity: 0.4 }} />;
    }
    return sortOrder === 'ASC' ? (
      <ArrowUp size={14} style={{ color: 'var(--primary)' }} />
    ) : (
      <ArrowDown size={14} style={{ color: 'var(--primary)' }} />
    );
  };

  // If store has 0 reviews at all
  if (reviews.length === 0) {
    return (
      <div 
        style={{ 
          background: '#ffffff', 
          border: '1px solid var(--border-subtle)', 
          padding: '2.5rem 1.5rem',
          textAlign: 'center',
          marginTop: '1.25rem'
        }}
      >
        <EmptyState
          icon={Star}
          title="No Customer Ratings Yet"
          description={`"${store?.name}" has not received any customer reviews or star ratings yet. As soon as customers rate your store, their submissions and feedback will be listed here.`}
        />
      </div>
    );
  }

  return (
    <div 
      style={{ 
        background: '#ffffff', 
        border: '1px solid var(--border-subtle)', 
        padding: '1.5rem',
        marginTop: '1.5rem',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      {/* Header with Title & Rating Distribution Breakdown */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <h4 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <User size={18} style={{ color: 'var(--primary)' }} />
            Customer Ratings & Feedback Table ({reviews.length})
          </h4>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
            Showing verified customer ratings submitted for {store?.name}
          </p>
        </div>

        {/* Rating Breakdown Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          {[5, 4, 3, 2, 1].map((stars) => (
            <button
              key={stars}
              type="button"
              onClick={() => {
                setRatingFilter(ratingFilter === String(stars) ? 'all' : String(stars));
                setCurrentPage(1);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.75rem',
                padding: '0.25rem 0.6rem',
                border: ratingFilter === String(stars) ? '1px solid var(--warning)' : '1px solid var(--border-medium)',
                background: ratingFilter === String(stars) ? 'var(--warning-bg)' : '#f8fafc',
                color: ratingFilter === String(stars) ? 'var(--warning)' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
            >
              <span>{stars}★</span>
              <span style={{ fontWeight: 700 }}>({ratingDistribution[stars]})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Filter & Search Bar matching Administrator table standards */}
      <div 
        style={{ 
          background: '#f8fafc', 
          border: '1px solid var(--border-subtle)', 
          padding: '1rem',
          marginBottom: '1.25rem'
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem', alignItems: 'flex-end' }}>
          {/* Customer Name Filter */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em', display: 'block', marginBottom: '0.35rem' }}>
              Customer Name
            </label>
            <FormInput
              placeholder="Search by customer name..."
              value={nameFilter}
              onChange={(e) => {
                setNameFilter(e.target.value);
                setCurrentPage(1);
              }}
              icon={Search}
              style={{ marginBottom: 0 }}
            />
          </div>

          {/* Customer Email Filter */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em', display: 'block', marginBottom: '0.35rem' }}>
              Contact Email
            </label>
            <FormInput
              placeholder="Search by email address..."
              value={emailFilter}
              onChange={(e) => {
                setEmailFilter(e.target.value);
                setCurrentPage(1);
              }}
              icon={Mail}
              style={{ marginBottom: 0 }}
            />
          </div>

          {/* Star Rating Filter */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em', display: 'block', marginBottom: '0.35rem' }}>
              Filter by Rating Score
            </label>
            <select
              className="form-select"
              value={ratingFilter}
              onChange={(e) => {
                setRatingFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={{ marginBottom: 0, height: '40px' }}
            >
              <option value="all">⭐ All Rating Scores</option>
              <option value="5">★★★★★ (5 Stars Only)</option>
              <option value="4">★★★★☆ (4 Stars Only)</option>
              <option value="3">★★★☆☆ (3 Stars Only)</option>
              <option value="2">★★☆☆☆ (2 Stars Only)</option>
              <option value="1">★☆☆☆☆ (1 Star Only)</option>
            </select>
          </div>

          {/* Reset Filters Action */}
          <div>
            <Button
              variant="outline"
              size="md"
              icon={RotateCcw}
              onClick={handleResetFilters}
              disabled={!isFiltered && sortField === 'createdAt' && sortOrder === 'DESC'}
              style={{ width: '100%', height: '40px' }}
            >
              Reset Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Tabular Data View */}
      {paginatedReviews.length > 0 ? (
        <>
          <div className="data-table-container" style={{ marginBottom: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th 
                    onClick={() => handleSort('name')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span>Customer Name</span>
                      {renderSortIcon('name')}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('email')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span>Customer Email</span>
                      {renderSortIcon('email')}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('rating')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span>Rating Given</span>
                      {renderSortIcon('rating')}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('createdAt')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span>Submission Date</span>
                      {renderSortIcon('createdAt')}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedReviews.map((review) => {
                  const ratingScore = Number(review.rating) || 0;
                  const isHighRating = ratingScore >= 4;
                  const isMidRating = ratingScore === 3;

                  return (
                    <tr key={review.id}>
                      {/* Customer Name & Address info */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <div 
                            style={{ 
                              width: '2rem', 
                              height: '2rem', 
                              background: 'var(--primary)', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              fontSize: '0.75rem', 
                              fontWeight: 700, 
                              color: '#fff',
                              flexShrink: 0
                            }}
                          >
                            {(review.user?.name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {review.user?.name || 'Customer Reviewer'}
                            </div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {review.user?.address ? review.user.address.split(',')[0] : 'Verified Customer'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Customer Email */}
                      <td>
                        <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.85rem' }}>
                          {review.user?.email || '—'}
                        </span>
                      </td>

                      {/* Rating Given */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <StarRating rating={ratingScore} readOnly size="sm" />
                          <span 
                            style={{ 
                              fontWeight: 700, 
                              fontSize: '0.8rem',
                              padding: '0.15rem 0.5rem',
                              background: isHighRating ? 'var(--success-bg)' : isMidRating ? 'var(--warning-bg)' : 'var(--danger-bg)',
                              color: isHighRating ? 'var(--success)' : isMidRating ? 'var(--warning)' : 'var(--danger)',
                              border: isHighRating ? '1px solid var(--success-border)' : isMidRating ? '1px solid var(--warning-border)' : '1px solid var(--danger-border)'
                            }}
                          >
                            {ratingScore} ★
                          </span>
                        </div>
                      </td>

                      {/* Submission Date */}
                      <td>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Calendar size={14} style={{ color: 'var(--primary)' }} />
                          {formatDate(review.createdAt)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            limit={itemsPerPage}
            onPageChange={(p) => setCurrentPage(p)}
          />
        </>
      ) : (
        /* Empty State when filters yield 0 matching rows */
        <div 
          style={{ 
            background: '#ffffff', 
            border: '1px dashed var(--border-medium)', 
            padding: '2.5rem 1rem', 
            textAlign: 'center' 
          }}
        >
          <Filter size={30} style={{ color: 'var(--text-muted)', marginBottom: '0.75rem', opacity: 0.6 }} />
          <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
            No Matching Customer Reviews Found
          </h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            No ratings match your currently applied search query or rating score filters.
          </p>
          <Button variant="outline" size="sm" icon={RotateCcw} onClick={handleResetFilters}>
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  );
}
