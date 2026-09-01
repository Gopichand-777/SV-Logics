import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Navbar from './components/layout/Navbar.jsx';
import Footer from './components/layout/Footer.jsx';
import Home from './pages/public/Home.jsx';
import Courses from './pages/public/Courses.jsx';
import CourseDetail from './pages/public/CourseDetail.jsx';
import Login from './pages/public/Login.jsx';
import PrivacyPolicy from './pages/public/PrivacyPolicy.jsx';
import TermsAndConditions from './pages/public/TermsAndConditions.jsx';
import Dashboard from './pages/student/Dashboard.jsx';
import Tests from './pages/student/Tests.jsx';
import TestSession from './pages/student/TestSession.jsx';
import TestResult from './pages/student/TestResult.jsx';
import Profile from './pages/student/Profile.jsx';

const ProtectedRoute = ({ children }) => {
  const { isLoggedIn, loading } = useAuth();
  if (loading) return <div className="loader"><div className="loader-spinner" /><p className="loader-text">Loading...</p></div>;
  return isLoggedIn ? children : <Navigate to="/login" replace />;
};

const GuestRoute = ({ children }) => {
  const { isLoggedIn, loading } = useAuth();
  if (loading) return <div className="loader"><div className="loader-spinner" /><p className="loader-text">Loading...</p></div>;
  return !isLoggedIn ? children : <Navigate to="/dashboard" replace />;
};

const PageLayout = ({ children }) => (
  <>
    <Navbar />
    <main style={{ minHeight: 'calc(100vh - 68px)' }}>{children}</main>
    <Footer />
  </>
);

export default function App() {
  return (
    <Routes>
      {/* Protected — students must log in first */}
      <Route path="/" element={<ProtectedRoute><PageLayout><Home /></PageLayout></ProtectedRoute>} />
      <Route path="/courses" element={<ProtectedRoute><PageLayout><Courses /></PageLayout></ProtectedRoute>} />
      <Route path="/courses/:id" element={<ProtectedRoute><PageLayout><CourseDetail /></PageLayout></ProtectedRoute>} />

      {/* Auth (login only — registration disabled, admin creates accounts) */}
      <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register" element={<Navigate to="/login" replace />} />

      {/* Legal */}
      <Route path="/privacy-policy" element={<PageLayout><PrivacyPolicy /></PageLayout>} />
      <Route path="/terms-and-conditions" element={<PageLayout><TermsAndConditions /></PageLayout>} />

      {/* Protected */}
      <Route path="/dashboard" element={<ProtectedRoute><PageLayout><Dashboard /></PageLayout></ProtectedRoute>} />
      <Route path="/tests" element={<ProtectedRoute><PageLayout><Tests /></PageLayout></ProtectedRoute>} />
      <Route path="/tests/:id/session" element={<ProtectedRoute><TestSession /></ProtectedRoute>} />
      <Route path="/tests/result/:attemptId" element={<ProtectedRoute><PageLayout><TestResult /></PageLayout></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><PageLayout><Profile /></PageLayout></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
