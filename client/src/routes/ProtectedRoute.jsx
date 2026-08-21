import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/common/LoadingSpinner';

/**
 * Route Guard for Authenticated and Role-Specific Routes
 * 
 * IMPORTANT ARCHITECTURAL NOTE:
 * This component provides UX navigation protection only.
 * The true security boundary is always the backend Express RBAC middleware.
 */
export default function ProtectedRoute({ allowedRoles = [] }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner fullPage text="Verifying authentication status..." />;
  }

  if (!isAuthenticated) {
    // Redirect unauthenticated visitor to login, saving intended route in state
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // User is logged in but lacks required role -> redirect to 403 Unauthorized view
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
