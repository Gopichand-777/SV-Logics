import axios from 'axios';

const api = axios.create({
  // In dev: '/api' is proxied to the backend server by Vite
  // In prod: set VITE_API_BASE_URL in your environment variables
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('svlogics-admin-token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      const errCode = err.response.data?.error;
      localStorage.removeItem('svlogics-admin-token');
      if (errCode === 'SESSION_INVALIDATED') {
        // Import toast lazily to avoid circular deps — Toast is mounted in main.jsx
        import('../components/toast.js').then(({ toast }) => {
          toast.warning('Your admin account was logged in from another device. You have been logged out.');
        });
        // Small delay so toast renders before redirect
        setTimeout(() => { window.location.href = '/login'; }, 1800);
        return Promise.reject(err);
      }
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

export const adminApi = {
  getOverview: () => api.get('/admin/overview'),

  // Students
  getStudents: (params) => api.get('/admin/students', { params }),
  createStudent: (data) => api.post('/admin/students', data),
  updateStudentStatus: (id, isActive) => api.patch(`/admin/students/${id}/status`, { isActive }),
  resetStudentPassword: (id, newPassword) => api.patch(`/admin/students/${id}/reset-password`, { newPassword }),
  deleteStudent: (id) => api.delete(`/admin/students/${id}`),

  // Student course access (admin grant/revoke)
  getStudentCourses: (studentId) => api.get(`/admin/students/${studentId}/courses`),
  grantCourseAccess: (studentId, courseId) => api.post(`/admin/students/${studentId}/courses/${courseId}/grant`),
  revokeCourseAccess: (studentId, courseId) => api.delete(`/admin/students/${studentId}/courses/${courseId}/revoke`),

  // Admin Staff
  getStaff: () => api.get('/admin/staff'),
  createStaff: (data) => api.post('/admin/staff', data),
  updateStaffStatus: (id, role, isActive) => api.patch(`/admin/staff/${id}/${role}/status`, { isActive }),
  deleteStaff: (id, role) => api.delete(`/admin/staff/${id}/${role}`),

  // Courses
  getCourses: () => api.get('/admin/courses'),
  createCourse: (data) => api.post('/admin/courses', data),
  updateCourse: (id, data) => api.put(`/admin/courses/${id}`, data),
  deleteCourse: (id) => api.delete(`/admin/courses/${id}`),

  // Course Subjects
  getSubjects:    (courseId) =>        api.get(`/admin/courses/${courseId}/subjects`),
  createSubject:  (courseId, data) =>  api.post(`/admin/courses/${courseId}/subjects`, data),
  updateSubject:  (id, data) =>        api.put(`/admin/subjects/${id}`, data),
  deleteSubject:  (id) =>              api.delete(`/admin/subjects/${id}`),

  // Chapters
  getChapters:    (courseId) =>        api.get(`/admin/courses/${courseId}/chapters`),
  createChapter:  (courseId, data) =>  api.post(`/admin/courses/${courseId}/chapters`, data),
  updateChapter:  (id, data) =>        api.put(`/admin/chapters/${id}`, data),
  deleteChapter:  (id) =>              api.delete(`/admin/chapters/${id}`),

  // Tests
  getTests: () => api.get('/admin/tests'),
  createTest: (data) => api.post('/admin/tests', data),
  updateTest: (id, data) => api.put(`/admin/tests/${id}`, data),
  deleteTest: (id) => api.delete(`/admin/tests/${id}`),

  // Questions
  getQuestions:   (testId) =>          api.get(`/admin/tests/${testId}/questions`),
  createQuestion: (testId, data) =>    api.post(`/admin/tests/${testId}/questions`, data),
  bulkImport:     (testId, questions) => api.post(`/admin/tests/${testId}/questions/bulk`, { questions }),
  updateQuestion: (id, data) =>        api.put(`/admin/questions/${id}`, data),
  deleteQuestion: (id) =>              api.delete(`/admin/questions/${id}`),

  // Enrollments & Payments
  getEnrollments: () => api.get('/admin/enrollments'),
  getPayments:    () => api.get('/admin/payments'),

  // Announcements
  getAnnouncements:   () =>       api.get('/admin/announcements'),
  createAnnouncement: (data) =>   api.post('/admin/announcements', data),

  // Materials
  getMaterials:   () =>         api.get('/admin/materials'),
  addMaterial:    (data) =>     api.post('/admin/materials', data),
  deleteMaterial: (id) =>       api.delete(`/admin/materials/${id}`),

  // Live Classes
  getLiveClasses:   ()          => api.get('/admin/live-classes'),
  createLiveClass:  (data)      => api.post('/admin/live-classes', data),
  updateLiveClass:  (id, data)  => api.put(`/admin/live-classes/${id}`, data),
  deleteLiveClass:  (id)        => api.delete(`/admin/live-classes/${id}`),

  // File Upload (R2 presigned PUT URL)
  // Returns { uploadUrl, key } — browser uploads directly to R2 using uploadUrl
  getUploadPresignedUrl: (filename, contentType, fileSize) =>
    api.post('/admin/upload/presign', { filename, contentType, fileSize }),

  // Auth
  logout: () => api.post('/auth/logout'),
};
