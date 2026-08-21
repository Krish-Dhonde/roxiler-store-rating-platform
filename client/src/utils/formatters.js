/**
 * Client-Side Formatting Utilities
 */

export function formatDate(dateString) {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch {
    return dateString;
  }
}

export function formatRating(rating) {
  const num = Number(rating);
  if (isNaN(num) || num === 0) return 'No ratings';
  return num.toFixed(1);
}

export function getRoleDisplayName(role) {
  switch (role) {
    case 'admin': return 'Administrator';
    case 'owner': return 'Store Owner';
    case 'user': return 'Customer';
    default: return role || 'Guest';
  }
}
