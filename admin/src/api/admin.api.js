import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
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
      localStorage.removeItem('svlogics-admin-token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// ── Admin API helpers ──────────────────────────────────────────────────────────
export const adminApi = {
  // Overview
  getOverview: () => api.get('/admin/overview'),

  // Users
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUserRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
  updateUserStatus: (id, isActive) => api.patch(`/admin/users/${id}/status`, { isActive }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),

  // Courses
  getCourses: () => api.get('/admin/courses'),
  createCourse: (data) => api.post('/admin/courses', data),
  updateCourse: (id, data) => api.put(`/admin/courses/${id}`, data),
  deleteCourse: (id) => api.delete(`/admin/courses/${id}`),

  // Chapters
  getChapters: (courseId) => api.get(`/admin/courses/${courseId}/chapters`),
  createChapter: (courseId, data) => api.post(`/admin/courses/${courseId}/chapters`, data),
  updateChapter: (id, data) => api.put(`/admin/chapters/${id}`, data),
  deleteChapter: (id) => api.delete(`/admin/chapters/${id}`),

  // Tests
  getTests: () => api.get('/admin/tests'),
  createTest: (data) => api.post('/admin/tests', data),
  updateTest: (id, data) => api.put(`/admin/tests/${id}`, data),
  deleteTest: (id) => api.delete(`/admin/tests/${id}`),

  // Questions
  getQuestions: (testId) => api.get(`/admin/tests/${testId}/questions`),
  createQuestion: (testId, data) => api.post(`/admin/tests/${testId}/questions`, data),
  bulkImport: (testId, questions) => api.post(`/admin/tests/${testId}/questions/bulk`, { questions }),
  updateQuestion: (id, data) => api.put(`/admin/questions/${id}`, data),
  deleteQuestion: (id) => api.delete(`/admin/questions/${id}`),

  // Enrollments & Payments
  getEnrollments: () => api.get('/admin/enrollments'),
  getPayments: () => api.get('/admin/payments'),

  // Announcements
  getAnnouncements: () => api.get('/admin/announcements'),
  createAnnouncement: (data) => api.post('/admin/announcements', data),

  // Materials
  getMaterials: () => api.get('/admin/materials'),
  addMaterial: (data) => api.post('/admin/materials', data),
  deleteMaterial: (id) => api.delete(`/admin/materials/${id}`),
};
