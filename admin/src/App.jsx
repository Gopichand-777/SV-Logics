import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Sidebar from './components/Sidebar.jsx';
import AdminLogin from './pages/Login.jsx';
import AdminDashboard from './pages/Dashboard.jsx';
import AdminCourses from './pages/Courses.jsx';
import AdminTests from './pages/Tests.jsx';
import AdminQuestions from './pages/Questions.jsx';
import AdminStudents from './pages/Users.jsx';
import AdminStaff from './pages/Staff.jsx';
import AdminEnrollments from './pages/Enrollments.jsx';
import AdminPayments from './pages/Payments.jsx';
import AdminAnnouncements from './pages/Announcements.jsx';
import AdminMaterials from './pages/Materials.jsx';
import AdminLiveClasses from './pages/LiveClasses.jsx';

const ProtectedRoute = ({ children, superOnly }) => {
  const { admin, loading, isSuperAdmin } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div className="spinner" />
    </div>
  );
  if (!admin) return <Navigate to="/login" replace />;
  if (superOnly && !isSuperAdmin) return <Navigate to="/dashboard" replace />;
  return children;
};

const AdminLayout = ({ children }) => (
  <div className="admin-layout">
    <Sidebar />
    <main className="admin-main">
      <div className="admin-content">{children}</div>
    </main>
  </div>
);

export default function App() {
  const { admin } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={admin ? <Navigate to="/dashboard" /> : <AdminLogin />} />

      <Route path="/dashboard" element={<ProtectedRoute><AdminLayout><AdminDashboard /></AdminLayout></ProtectedRoute>} />
      <Route path="/courses" element={<ProtectedRoute><AdminLayout><AdminCourses /></AdminLayout></ProtectedRoute>} />
      <Route path="/tests" element={<ProtectedRoute><AdminLayout><AdminTests /></AdminLayout></ProtectedRoute>} />
      <Route path="/questions" element={<ProtectedRoute><AdminLayout><AdminQuestions /></AdminLayout></ProtectedRoute>} />
      <Route path="/materials" element={<ProtectedRoute><AdminLayout><AdminMaterials /></AdminLayout></ProtectedRoute>} />
      <Route path="/announcements" element={<ProtectedRoute><AdminLayout><AdminAnnouncements /></AdminLayout></ProtectedRoute>} />
      <Route path="/live-classes"   element={<ProtectedRoute><AdminLayout><AdminLiveClasses /></AdminLayout></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute superOnly><AdminLayout><AdminStudents /></AdminLayout></ProtectedRoute>} />
      <Route path="/staff" element={<ProtectedRoute superOnly><AdminLayout><AdminStaff /></AdminLayout></ProtectedRoute>} />
      <Route path="/enrollments" element={<ProtectedRoute superOnly><AdminLayout><AdminEnrollments /></AdminLayout></ProtectedRoute>} />
      <Route path="/payments" element={<ProtectedRoute superOnly><AdminLayout><AdminPayments /></AdminLayout></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
