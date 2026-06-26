import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Layout from './components/Layout';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { HelmetProvider } from 'react-helmet-async';
import { Loader2 } from 'lucide-react';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const ListingsPage = lazy(() => import('./pages/ListingsPage'));
const ListingDetailsPage = lazy(() => import('./pages/ListingDetailsPage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const RoommatesPage = lazy(() => import('./pages/RoommatesPage'));
const PostPropertyPage = lazy(() => import('./pages/PostPropertyPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const CompleteProfilePage = lazy(() => import('./pages/CompleteProfilePage'));
const MoversPage = lazy(() => import('./pages/MoversPage'));
const MoverDashboardPage = lazy(() => import('./pages/MoverDashboardPage'));
const OwnerProfilePage = lazy(() => import('./pages/OwnerProfilePage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const FaqPage = lazy(() => import('./pages/FaqPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const FlatRentalPortal = lazy(() => import('./pages/FlatRentalPortal'));
const PgHostelPortal = lazy(() => import('./pages/PgHostelPortal'));
const OfficeSpacePortal = lazy(() => import('./pages/OfficeSpacePortal'));
const WarehousePortal = lazy(() => import('./pages/WarehousePortal'));
const SplitExpensesPage = lazy(() => import('./pages/SplitExpensesPage'));

// ✅ Scroll to top on EVERY page navigation — fixes "page stays scrolled down" bug
// Works globally: covers ALL links site-wide (Navbar, Footer, CTA buttons, cards, etc.)
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

// Redirect unauthenticated users to /auth, and incomplete profiles to /complete-profile
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (isAuthenticated && user && user.profileCompleted === false) return <Navigate to="/complete-profile" replace />;
  return children;
};

// Only ADMIN role can access admin pages
const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
};

// Global fallback loader for Suspense
const SuspenseFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
    <Loader2 size={40} className="text-primary-500 animate-spin" />
  </div>
);

function App() {
  // Google Client ID must be set via VITE_GOOGLE_CLIENT_ID env var (never hardcode here)
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  return (
    <HelmetProvider>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ThemeProvider>
        <AuthProvider>
        <Router>
          {/* ScrollToTop must be INSIDE <Router> so it can use useLocation() */}
          <ScrollToTop />
          <Layout>
            <Suspense fallback={<SuspenseFallback />}>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/listings" element={<ListingsPage />} />
                <Route path="/listings/:id/:slug?" element={<ListingDetailsPage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/roommates" element={<RoommatesPage />} />
                <Route path="/movers" element={<MoversPage />} />
                <Route path="/complete-profile" element={<CompleteProfilePage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/faq" element={<FaqPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/owner/:id" element={<OwnerProfilePage />} />
                <Route path="/flats" element={<FlatRentalPortal />} />
                <Route path="/pgs" element={<PgHostelPortal />} />
                <Route path="/offices" element={<OfficeSpacePortal />} />
                <Route path="/warehouses" element={<WarehousePortal />} />

                {/* Protected routes — must be logged in */}
                <Route path="/post-property" element={<ProtectedRoute><PostPropertyPage /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                <Route path="/messages" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
                <Route path="/mover-dashboard" element={<ProtectedRoute><MoverDashboardPage /></ProtectedRoute>} />
                <Route path="/split-expenses" element={<ProtectedRoute><SplitExpensesPage /></ProtectedRoute>} />

                {/* Admin only */}
                <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />

                {/* Fallback route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </Layout>
        </Router>
        </AuthProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
    </HelmetProvider>
  );
}

export default App;
