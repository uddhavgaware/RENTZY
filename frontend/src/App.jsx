import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import ListingsPage from './pages/ListingsPage';
import ListingDetailsPage from './pages/ListingDetailsPage';
import AuthPage from './pages/AuthPage';
import RoommatesPage from './pages/RoommatesPage';
import PostPropertyPage from './pages/PostPropertyPage';
import DashboardPage from './pages/DashboardPage';
import ChatPage from './pages/ChatPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import CompleteProfilePage from './pages/CompleteProfilePage';
import MoversPage from './pages/MoversPage';
import MoverDashboardPage from './pages/MoverDashboardPage';
import AboutPage from './pages/AboutPage';
import FaqPage from './pages/FaqPage';
import TermsPage from './pages/TermsPage';
import { AuthProvider, useAuth } from './context/AuthContext';

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

function App() {
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "872152634254-62koq8amssj0d0l6gqnta33kv3is670u.apps.googleusercontent.com";

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <Router>
          {/* ScrollToTop must be INSIDE <Router> so it can use useLocation() */}
          <ScrollToTop />
          <Layout>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/listings" element={<ListingsPage />} />
              <Route path="/listings/:id" element={<ListingDetailsPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/roommates" element={<RoommatesPage />} />
              <Route path="/movers" element={<MoversPage />} />
              <Route path="/complete-profile" element={<CompleteProfilePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/faq" element={<FaqPage />} />
              <Route path="/terms" element={<TermsPage />} />

              {/* Protected routes — must be logged in */}
              <Route path="/post-property" element={<ProtectedRoute><PostPropertyPage /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="/messages" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
              <Route path="/mover-dashboard" element={<ProtectedRoute><MoverDashboardPage /></ProtectedRoute>} />

              {/* Admin only */}
              <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </Router>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
