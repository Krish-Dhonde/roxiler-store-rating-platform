import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export default function AlertMessage({
  type = 'danger',
  title,
  message,
  errors = [],
  className = ''
}) {
  if (!message && (!errors || errors.length === 0)) return null;

  const icons = {
    danger: AlertCircle,
    success: CheckCircle2,
    warning: AlertTriangle,
    info: Info
  };

  const Icon = icons[type] || AlertCircle;

  return (
    <div className={`alert alert-${type} ${className}`} role="alert">
      <Icon size={18} className="alert-icon" />
      <div className="alert-content">
        {title && <strong>{title}</strong>}
        {message && <div>{message}</div>}
        {errors && errors.length > 0 && (
          <ul className="alert-list">
            {errors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
