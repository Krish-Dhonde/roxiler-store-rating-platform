import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';
import ProtectedRoute from './ProtectedRoute';
import PublicOnlyRoute from './PublicOnlyRoute';

// Pages
import Login from '../pages/auth/Login';
import Signup from '../pages/auth/Signup';
import RegisterStore from '../pages/auth/RegisterStore';
import Profile from '../pages/shared/Profile';
import ChangePassword from '../pages/shared/ChangePassword';
import Unauthorized from '../pages/shared/Unauthorized';
import NotFound from '../pages/shared/NotFound';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminUsers from '../pages/admin/AdminUsers';
import AdminStores from '../pages/admin/AdminStores';
import StoreExplorer from '../pages/user/StoreExplorer';
import MyRatings from '../pages/user/MyRatings';
import OwnerDashboard from '../pages/owner/OwnerDashboard';

export default function AppRoutes() {
  return (
    <Routes>
      {/* 1. Public-Only Authentication Routes */}
      <Route element={<PublicOnlyRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/register-store" element={<RegisterStore />} />
        </Route>
      </Route>

      {/* 2. Main Layout App Routes */}
      <Route element={<MainLayout />}>
        {/* Root Redirects to Stores Directory */}
        <Route path="/" element={<Navigate to="/stores" replace />} />
        <Route path="/stores" element={<StoreExplorer />} />

        {/* Common Protected Routes (Any authenticated role) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<Profile />} />
          <Route path="/change-password" element={<ChangePassword />} />
        </Route>

        {/* Admin-Only Routes */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/stores" element={<AdminStores />} />
        </Route>

        {/* Store Owner-Only Routes */}
        <Route element={<ProtectedRoute allowedRoles={['owner']} />}>
          <Route path="/owner/dashboard" element={<OwnerDashboard />} />
        </Route>

        {/* Customer User-Only Routes */}
        <Route element={<ProtectedRoute allowedRoles={['user']} />}>
          <Route path="/user/ratings" element={<MyRatings />} />
        </Route>

        {/* Feedback & Error Pages */}
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
