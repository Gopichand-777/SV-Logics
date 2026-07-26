import api from './axios.js';
export const testsApi = {
  getAll: (params) => api.get('/tests', { params }),
  getById: (id) => api.get(`/tests/${id}`),
  submit: (id, data) => api.post(`/tests/${id}/submit`, data),
  getHistory: () => api.get('/tests/attempts/history'),
  getResult: (attemptId) => api.get(`/tests/attempts/${attemptId}`),
};
