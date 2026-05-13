import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sas_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('sas_token');
      localStorage.removeItem('sas_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
};

// CV Builder
export const cvAPI = {
  generate: (data) => api.post('/cv/generate', data, { timeout: 120000 }),
  fetchGithub: (data) => api.post('/cv/fetch-github', data),
  generateBullets: (data) => api.post('/cv/generate-bullets', data, { timeout: 60000 }),
  compileLaTeX: (data) => api.post('/cv/compile-latex', data, { timeout: 120000 }),
};

// ATS Checker
export const atsAPI = {
  analyze: (formData) => api.post('/ats/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  }),
};

// Assignments
export const assignmentAPI = {
  solve: (data) => api.post('/assignments/solve', data, { responseType: 'blob', timeout: 120000 }),
};

// Scholarships
export const scholarshipAPI = {
  getAll: (params) => api.get('/scholarships', { params }),
  scrape: () => api.post('/scholarships/scrape'),
};

// Contests
export const contestAPI = {
  getAll: (params) => api.get('/contests', { params }),
  refresh: () => api.post('/contests/refresh'),
};

// Tasks
export const taskAPI = {
  getAll: (params) => api.get('/tasks', { params }),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  prioritize: () => api.post('/tasks/prioritize'),
};

export default api;
