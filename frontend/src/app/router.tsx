import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProviders } from './providers';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { useAuthStore } from '../store/authStore';

// Lazy-loaded feature modules
const Login          = lazy(() => import('../features/auth/Login').then(m => ({ default: m.Login })));
const Signup         = lazy(() => import('../features/auth/Signup').then(m => ({ default: m.Signup })));
const ForgotPassword = lazy(() => import('../features/auth/ForgotPassword').then(m => ({ default: m.ForgotPassword })));
const ResetPassword  = lazy(() => import('../features/auth/ResetPassword').then(m => ({ default: m.ResetPassword })));
const Dashboard      = lazy(() => import('../features/dashboard/Dashboard').then(m => ({ default: m.Dashboard })));
const Vehicles     = lazy(() => import('../features/vehicles/Vehicles').then(m => ({ default: m.Vehicles })));
const Drivers      = lazy(() => import('../features/drivers/Drivers').then(m => ({ default: m.Drivers })));
const Dispatch     = lazy(() => import('../features/dispatch/Dispatch').then(m => ({ default: m.Dispatch })));
const Tracking     = lazy(() => import('../features/tracking/Tracking').then(m => ({ default: m.Tracking })));
const Maintenance  = lazy(() => import('../features/maintenance/Maintenance').then(m => ({ default: m.Maintenance })));
const FuelExpenses = lazy(() => import('../features/fuel-expenses/FuelExpenses').then(m => ({ default: m.FuelExpenses })));
const Analytics    = lazy(() => import('../features/analytics/Analytics').then(m => ({ default: m.Analytics })));
const Settings     = lazy(() => import('../features/settings/Settings').then(m => ({ default: m.Settings })));

// Page loading skeleton
const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center h-64 w-full">
    <div className="flex flex-col items-center gap-3">
      <div className="h-8 w-8 rounded-full border-2 border-border border-t-foreground animate-spin" />
      <span className="text-xs text-muted-foreground font-semibold">Loading module...</span>
    </div>
  </div>
);

// Protected route guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { accessToken } = useAuthStore();
  if (!accessToken) return <Navigate to="/login" replace />;
  return <DashboardLayout>{children}</DashboardLayout>;
};

export const Router: React.FC = () => (
  <BrowserRouter>
    <AppProviders>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected routes inside the Dashboard shell */}
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/vehicles" element={<ProtectedRoute><Vehicles /></ProtectedRoute>} />
          <Route path="/drivers" element={<ProtectedRoute><Drivers /></ProtectedRoute>} />
          <Route path="/dispatch" element={<ProtectedRoute><Dispatch /></ProtectedRoute>} />
          <Route path="/tracking" element={<ProtectedRoute><Tracking /></ProtectedRoute>} />
          <Route path="/maintenance" element={<ProtectedRoute><Maintenance /></ProtectedRoute>} />
          <Route path="/fuel" element={<ProtectedRoute><FuelExpenses /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AppProviders>
  </BrowserRouter>
);
