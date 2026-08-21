import React, { useState, useEffect } from 'react';
import { ratingService } from '../../services/ratingService';
import Modal from '../common/Modal';
import StarRating from '../common/StarRating';
import Button from '../common/Button';
import AlertMessage from '../common/AlertMessage';
import { Star, CheckCircle } from 'lucide-react';

export default function RatingModal({
  isOpen,
  onClose,
  store,
  onRatingSuccess
}) {
  const [rating, setRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const isExistingRating = store?.myRating !== null && store?.myRating !== undefined;

  useEffect(() => {
    if (store?.myRating) {
      setRating(Number(store.myRating));
    } else {
      setRating(0);
    }
    setError(null);
  }, [store, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating || rating < 1 || rating > 5) {
      setError('Please select a star rating between 1 and 5.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (isExistingRating) {
        await ratingService.modifyRating(store.id, rating);
      } else {
        await ratingService.submitRating(store.id, rating);
      }

      if (onRatingSuccess) {
        onRatingSuccess(store.id, rating);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit rating. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!store) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isExistingRating ? 'Modify Store Rating' : 'Rate This Store'}
    >
      <form onSubmit={handleSubmit}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{store.name}</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{store.address}</p>
        </div>

        {error && <AlertMessage type="danger" message={error} />}

        <div
          style={{
            background: '#f8fafc',
            border: '1px solid var(--border-subtle)',
            padding: '1.75rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1.5rem'
          }}
        >
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Select your rating (1 to 5 stars):
          </p>

          <StarRating
            rating={rating}
            onChange={setRating}
            size="lg"
            showLabel
          />

          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {rating === 1 && '⭐ Poor'}
            {rating === 2 && '⭐⭐ Fair'}
            {rating === 3 && '⭐⭐⭐ Good'}
            {rating === 4 && '⭐⭐⭐⭐ Very Good'}
            {rating === 5 && '⭐⭐⭐⭐⭐ Excellent!'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            icon={isExistingRating ? CheckCircle : Star}
            disabled={!rating || rating < 1}
          >
            {isExistingRating ? 'Update Rating' : 'Submit Rating'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
