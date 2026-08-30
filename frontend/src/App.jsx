import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Navbar from './components/layout/Navbar.jsx';
import Footer from './components/layout/Footer.jsx';
import Home from './pages/public/Home.jsx';
import Courses from './pages/public/Courses.jsx';
import CourseDetail from './pages/public/CourseDetail.jsx';
import Login from './pages/public/Login.jsx';
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
  if (loading) return null;
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
      {/* Public */}
      <Route path="/" element={<PageLayout><Home /></PageLayout>} />
      <Route path="/courses" element={<PageLayout><Courses /></PageLayout>} />
      <Route path="/courses/:id" element={<PageLayout><CourseDetail /></PageLayout>} />

      {/* Auth (login only — registration disabled, admin creates accounts) */}
      <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register" element={<Navigate to="/login" replace />} />

      {/* Protected */}
      <Route path="/dashboard" element={<ProtectedRoute><PageLayout><Dashboard /></PageLayout></ProtectedRoute>} />
      <Route path="/tests" element={<ProtectedRoute><PageLayout><Tests /></PageLayout></ProtectedRoute>} />
      <Route path="/tests/:id/session" element={<ProtectedRoute><TestSession /></ProtectedRoute>} />
      <Route path="/tests/result/:attemptId" element={<ProtectedRoute><PageLayout><TestResult /></PageLayout></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><PageLayout><Profile /></PageLayout></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
