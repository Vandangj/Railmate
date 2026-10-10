import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import TravelAssistantPage from './pages/TravelAssistantPage';
import RouteComparisonPage from './pages/RouteComparisonPage';
import RouteMapPage from './pages/RouteMapPage';
import BookingReviewPage from './pages/BookingReviewPage';
import MyTripsPage from './pages/MyTripsPage';
import BookingDetailsPage from './pages/BookingDetailsPage';
import NotificationCentrePage from './pages/NotificationCentrePage';
import ProfilePage from './pages/ProfilePage';
import SupportPage from './pages/SupportPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-railway-dark text-slate-100 font-sans">
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/assistant" element={<TravelAssistantPage />} />
              <Route path="/routes" element={<RouteComparisonPage />} />
              <Route path="/map" element={<RouteMapPage />} />
              <Route path="/support" element={<SupportPage />} />

              {/* Protected User Routes */}
              <Route
                path="/booking/review"
                element={
                  <ProtectedRoute>
                    <BookingReviewPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/trips"
                element={
                  <ProtectedRoute>
                    <MyTripsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/trips/:id"
                element={
                  <ProtectedRoute>
                    <BookingDetailsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <NotificationCentrePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* Admin Protected Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminDashboardPage />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
