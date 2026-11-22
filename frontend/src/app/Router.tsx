import React from 'react';
import { createBrowserRouter, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/Spinner';

// Layouts
import { MainLayout } from '@/layouts/MainLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { AuthLayout } from '@/layouts/AuthLayout';

// Public Pages
import { LandingPage } from '@/pages/LandingPage';
import { SearchPage } from '@/pages/properties/SearchPage';
import { PropertyDetailPage } from '@/pages/properties/PropertyDetailPage';
import { BrowseListingsPage } from '@/pages/listings/BrowseListingsPage';
import { ListingDetailPage } from '@/pages/listings/ListingDetailPage';

// Auth Pages
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';

// Dashboard Pages
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { CreatePropertyPage } from '@/pages/properties/CreatePropertyPage';
import { MyListingsPage } from '@/pages/dashboard/MyListingsPage';
import { ListingEditorPage } from '@/pages/dashboard/ListingEditorPage';
import { ListingModerationPage } from '@/pages/dashboard/ListingModerationPage';
import { LeadsPage } from '@/pages/dashboard/LeadsPage';
import { VisitsPage } from '@/pages/dashboard/VisitsPage';
import { TransactionsPage } from '@/pages/dashboard/TransactionsPage';
import { KYCPage } from '@/pages/dashboard/KYCPage';
import { SettingsPage } from '@/pages/dashboard/SettingsPage';
import { VerificationPage } from '@/pages/dashboard/VerificationPage';
import { AnalyticsPage } from '@/pages/dashboard/AnalyticsPage';
import { BuildersAndInvestmentsPage } from '@/pages/dashboard/BuildersAndInvestmentsPage';

// Protected Route Wrapper
export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Spinner size="lg" className="text-primary-600 mb-3" />
        <p className="text-sm font-medium text-slate-500">Checking PropMind Authentication...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return <>{children}</>;
};

// Router Definition
export const router = createBrowserRouter([
  // Public Root Layout
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <LandingPage />,
      },
      {
        path: 'properties',
        element: <SearchPage />,
      },
      {
        path: 'properties/:id',
        element: <PropertyDetailPage />,
      },
      {
        path: 'listings',
        element: <BrowseListingsPage />,
      },
      {
        path: 'listings/:id',
        element: <ListingDetailPage />,
      },
    ],
  },

  // Auth Flow Layout (Centered Card)
  {
    element: <AuthLayout />,
    children: [
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'register',
        element: <RegisterPage />,
      },
      {
        path: 'forgot-password',
        element: <ForgotPasswordPage />,
      },
      {
        path: 'reset-password',
        element: <ResetPasswordPage />,
      },
    ],
  },

  // Protected Dashboard Area
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'properties',
        element: <SearchPage />,
      },
      {
        path: 'properties/new',
        element: <CreatePropertyPage />,
      },
      {
        path: 'properties/:id/edit',
        element: <CreatePropertyPage />,
      },
      {
        path: 'listings',
        element: <MyListingsPage />,
      },
      {
        path: 'listings/new',
        element: <ListingEditorPage />,
      },
      {
        path: 'listings/:id/edit',
        element: <ListingEditorPage />,
      },
      {
        path: 'listings/moderation',
        element: <ListingModerationPage />,
      },
      {
        path: 'leads',
        element: <LeadsPage />,
      },
      {
        path: 'visits',
        element: <VisitsPage />,
      },
      {
        path: 'transactions',
        element: <TransactionsPage />,
      },
      {
        path: 'kyc',
        element: <KYCPage />,
      },
      {
        path: 'verification',
        element: <VerificationPage />,
      },
      {
        path: 'analytics',
        element: <AnalyticsPage />,
      },
      {
        path: 'ventures',
        element: <BuildersAndInvestmentsPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
    ],
  },

  // Catch-all 404 redirect to Home
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
