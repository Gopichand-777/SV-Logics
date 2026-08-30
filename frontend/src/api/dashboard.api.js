import api from './axios.js';
export const dashboardApi = {
  get: () => api.get('/dashboard'),
};
export const paymentApi = {
  initiate: (courseId) => api.post('/payments/initiate', { courseId }),
  verify: (paymentId) => api.post('/payments/verify', { paymentId }),
  getHistory: () => api.get('/payments/history'),
  getEnrollments: () => api.get('/payments/enrollments'),
  checkEnrollment: (courseId) => api.get(`/payments/check/${courseId}`),
};
