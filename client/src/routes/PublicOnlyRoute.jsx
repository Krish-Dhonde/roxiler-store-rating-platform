import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/common/LoadingSpinner';

/**
 * Route Guard for Public-Only Routes (e.g. /login, /signup)
 * 
 * Prevents already authenticated users from seeing login/signup screens
 * and automatically redirects them to their respective role dashboard.
 */
export default function PublicOnlyRoute() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullPage text="Checking session..." />;
  }

  if (isAuthenticated) {
    switch (user?.role) {
      case 'admin':
        return <Navigate to="/admin/dashboard" replace />;
      case 'owner':
        return <Navigate to="/owner/dashboard" replace />;
      case 'user':
      default:
        return <Navigate to="/stores" replace />;
    }
  }

  return <Outlet />;
}
