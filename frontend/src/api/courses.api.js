import api from './axios.js';
export const coursesApi = {
  getAll: (params) => api.get('/courses', { params }),
  getById: (id) => api.get(`/courses/${id}`),
  getChapters: (id) => api.get(`/courses/${id}/chapters`),
};
