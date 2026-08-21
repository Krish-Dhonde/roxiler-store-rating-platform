import React from 'react';

export default function PageContainer({
  title,
  subtitle,
  actions,
  children,
  className = ''
}) {
  return (
    <div className={`page-container ${className}`}>
      {(title || subtitle || actions) && (
        <div className="page-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem', width: '100%' }}>
            <div>
              {title && <h1 className="page-title">{title}</h1>}
              {subtitle && <p className="page-subtitle">{subtitle}</p>}
            </div>
            {actions && <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>{actions}</div>}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
