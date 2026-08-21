import React from 'react';

export default function StatCard({
  title,
  value,
  icon: Icon,
  color = 'primary',
  subtitle,
  className = ''
}) {
  const colorStyles = {
    primary: {
      bg: '#eff6ff',
      text: 'var(--primary)',
      border: '#bfdbfe'
    },
    purple: {
      bg: '#f5f3ff',
      text: '#6d28d9',
      border: '#ddd6fe'
    },
    amber: {
      bg: 'var(--warning-bg)',
      text: 'var(--warning)',
      border: 'var(--warning-border)'
    },
    cyan: {
      bg: '#ecfeff',
      text: '#0e7490',
      border: '#a5f3fc'
    }
  };

  const selectedColor = colorStyles[color] || colorStyles.primary;

  return (
    <div className={`glass-card stat-card ${className}`} style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
      {Icon && (
        <div
          style={{
            width: '3.5rem',
            height: '3.5rem',
            borderRadius: 'var(--radius-md)',
            background: selectedColor.bg,
            color: selectedColor.text,
            border: `1px solid ${selectedColor.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <Icon size={26} />
        </div>
      )}

      <div>
        <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
          {title}
        </p>
        <h2 style={{ fontSize: '2.25rem', fontWeight: 800, lineHeight: 1.1 }}>
          {value !== undefined && value !== null ? value : '—'}
        </h2>
        {subtitle && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{subtitle}</p>}
      </div>
    </div>
  );
}
