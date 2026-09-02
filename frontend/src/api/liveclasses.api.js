import api from './axios.js';

export const liveClassesApi = {
  /** GET /api/live-classes — returns all active (published) live classes */
  getAll: () => api.get('/live-classes'),
};
