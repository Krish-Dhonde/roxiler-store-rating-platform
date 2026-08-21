import React, { useState } from 'react';
import { Star } from 'lucide-react';

export default function StarRating({
  rating = 0,
  maxStars = 5,
  onChange,
  readOnly = false,
  size = 'md',
  showLabel = false,
  className = ''
}) {
  const [hoverRating, setHoverRating] = useState(0);

  const starSizes = {
    sm: 14,
    md: 20,
    lg: 28
  };

  const starPixelSize = starSizes[size] || 20;

  const handleMouseEnter = (index) => {
    if (!readOnly && onChange) {
      setHoverRating(index);
    }
  };

  const handleMouseLeave = () => {
    if (!readOnly && onChange) {
      setHoverRating(0);
    }
  };

  const handleClick = (index) => {
    if (!readOnly && onChange) {
      onChange(index);
    }
  };

  const handleKeyDown = (e, index) => {
    if (readOnly || !onChange) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onChange(index);
    } else if (e.key === 'ArrowRight' && index < maxStars) {
      e.preventDefault();
      onChange(index + 1);
    } else if (e.key === 'ArrowLeft' && index > 1) {
      e.preventDefault();
      onChange(index - 1);
    }
  };

  const activeRating = hoverRating || rating;

  return (
    <div
      className={`star-rating-container ${readOnly ? 'read-only' : 'interactive'} ${className}`}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
      role={readOnly ? 'img' : 'radiogroup'}
      aria-label={`Rating: ${rating} out of ${maxStars} stars`}
    >
      {[...Array(maxStars)].map((_, i) => {
        const starValue = i + 1;
        const isFilled = starValue <= activeRating;

        return (
          <button
            key={i}
            type="button"
            className={`star-btn ${isFilled ? 'filled' : 'empty'}`}
            disabled={readOnly}
            onClick={() => handleClick(starValue)}
            onMouseEnter={() => handleMouseEnter(starValue)}
            onMouseLeave={handleMouseLeave}
            onKeyDown={(e) => handleKeyDown(e, starValue)}
            tabIndex={readOnly ? -1 : 0}
            role={readOnly ? 'presentation' : 'radio'}
            aria-checked={starValue === rating}
            aria-label={`${starValue} Star${starValue > 1 ? 's' : ''}`}
            style={{
              background: 'none',
              border: 'none',
              cursor: readOnly ? 'default' : 'pointer',
              padding: '0.1rem',
              color: isFilled ? '#fbbf24' : 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.1s ease, color 0.1s ease'
            }}
          >
            <Star
              size={starPixelSize}
              fill={isFilled ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth={2}
            />
          </button>
        );
      })}

      {showLabel && (
        <span style={{ marginLeft: '0.5rem', fontWeight: 600, fontSize: size === 'sm' ? '0.8rem' : '0.9rem', color: 'var(--text-primary)' }}>
          {rating > 0 ? Number(rating).toFixed(1) : 'Unrated'}
        </span>
      )}
    </div>
  );
}
