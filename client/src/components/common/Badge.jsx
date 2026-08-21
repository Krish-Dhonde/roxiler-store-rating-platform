import React from 'react';
import { Shield, Store, User, Star } from 'lucide-react';
import { getRoleDisplayName } from '../../utils/formatters';

export default function Badge({
  role,
  rating,
  variant,
  children,
  className = ''
}) {
  if (role) {
    const roleIcons = {
      admin: Shield,
      owner: Store,
      user: User
    };
    const Icon = roleIcons[role] || User;

    return (
      <span className={`badge badge-${role} ${className}`}>
        <Icon size={12} />
        <span>{getRoleDisplayName(role)}</span>
      </span>
    );
  }

  if (rating !== undefined) {
    return (
      <span className={`badge badge-rating ${className}`}>
        <Star size={12} fill="currentColor" />
        <span>{Number(rating) > 0 ? Number(rating).toFixed(1) : 'New'}</span>
      </span>
    );
  }

  return <span className={`badge ${variant ? `badge-${variant}` : ''} ${className}`}>{children}</span>;
}
