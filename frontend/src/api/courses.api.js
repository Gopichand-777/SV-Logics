import api from './axios.js';
export const coursesApi = {
  getAll:            (params) => api.get('/courses', { params }),
  getById:           (id)     => api.get(`/courses/${id}`),
  getChapters:       (id)     => api.get(`/courses/${id}/chapters`),
  getAnnouncements:  ()       => api.get('/courses/announcements'),
  // Fetch signed/external video URL for a chapter (requires auth for paid chapters)
  getChapterVideo:   (id)     => api.get(`/courses/chapters/${id}/video`),
};
