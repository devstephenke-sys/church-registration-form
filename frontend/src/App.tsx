import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';

// Public Pages
import LandingPage from './pages/LandingPage';
import RegisterPage from './pages/RegisterPage';
import PaymentStatusPage from './pages/PaymentStatusPage';
import SuccessPage from './pages/SuccessPage';
import PaymentFailedPage from './pages/PaymentFailedPage';
import VerifyPage from './pages/VerifyPage';

// Admin Pages
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminRegistrations from './pages/admin/AdminRegistrations';
import AdminRegistrationDetail from './pages/admin/AdminRegistrationDetail';
import AdminVerify from './pages/admin/AdminVerify';
import AdminRoute from './components/AdminRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/payment/:registrationId" element={<PaymentStatusPage />} />
        <Route path="/success/:registrationId" element={<SuccessPage />} />
        <Route path="/payment-failed" element={<PaymentFailedPage />} />
        <Route path="/verify/:token" element={<VerifyPage />} />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/registrations" element={<AdminRoute><AdminRegistrations /></AdminRoute>} />
        <Route path="/admin/registrations/:id" element={<AdminRoute><AdminRegistrationDetail /></AdminRoute>} />
        <Route path="/admin/verify" element={<AdminRoute><AdminVerify /></AdminRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
