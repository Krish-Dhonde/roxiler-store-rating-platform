import React from 'react';

export default function LoadingSpinner({
  size = 'md',
  text = 'Loading...',
  fullPage = false,
  className = ''
}) {
  const spinnerClass = size === 'lg' ? 'spinner-lg' : '';

  if (fullPage) {
    return (
      <div className="loading-fullpage" role="status" aria-live="polite">
        <div className={`spinner ${spinnerClass}`} />
        {text && <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>{text}</p>}
      </div>
    );
  }

  return (
    <div className={`loading-container ${className}`} role="status" aria-live="polite">
      <div className={`spinner ${spinnerClass}`} />
      {text && <p>{text}</p>}
    </div>
  );
}
