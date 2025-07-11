import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    // Show error toast for 4xx and 5xx errors
    if (error.response?.status >= 400) {
      const message = error.response.data?.message || 'An error occurred';
      toast.error(message);
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  changePassword: (passwordData) => api.put('/auth/change-password', passwordData),
};

// Tasks API
export const tasksAPI = {
  getTasks: (params) => api.get('/tasks', { params }),
  getTask: (taskId) => api.get(`/tasks/${taskId}`),
  createTask: (taskData) => api.post('/tasks', taskData),
  updateTask: (taskId, taskData) => api.put(`/tasks/${taskId}`, taskData),
  deleteTask: (taskId) => api.delete(`/tasks/${taskId}`),
  moveTask: (taskId, moveData) => api.put(`/tasks/${taskId}/move`, moveData),
  assignTask: (taskId, assignData) => api.put(`/tasks/${taskId}/assign`, assignData),
  smartAssignTask: (taskId, data) => api.post(`/tasks/${taskId}/smart-assign`, data),
  addComment: (taskId, comment) => api.post(`/tasks/${taskId}/comments`, comment),
  archiveTask: (taskId) => api.put(`/tasks/${taskId}/archive`),
};

// Users API
export const usersAPI = {
  getUsers: (params) => api.get('/users', { params }),
  getUser: (userId) => api.get(`/users/${userId}`),
  getDashboard: () => api.get('/users/dashboard'),
  getWorkload: () => api.get('/users/workload'),
  updateUser: (userId, userData) => api.put(`/users/${userId}`, userData),
  deactivateUser: (userId) => api.put(`/users/${userId}/deactivate`),
  reactivateUser: (userId) => api.put(`/users/${userId}/reactivate`),
};

// Activities API
export const activitiesAPI = {
  getActivities: (params) => api.get('/activities', { params }),
  getActivityStats: (params) => api.get('/activities/stats', { params }),
  getUserActivities: (userId, params) => api.get(`/activities/user/${userId}`, { params }),
  getTaskActivities: (taskId, params) => api.get(`/activities/task/${taskId}`, { params }),
  resolveConflict: (activityId, resolution) => api.put(`/activities/conflict/${activityId}/resolve`, resolution),
  cleanupActivities: (data) => api.post('/activities/cleanup', data),
};

// File upload utility
export const uploadFile = async (file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);

  return api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress) {
        const progress = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(progress);
      }
    },
  });
};

// Utility functions
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const message = error.response.data?.message || 'Server error occurred';
    return { message, status: error.response.status };
  } else if (error.request) {
    // Request was made but no response received
    return { message: 'Network error. Please check your connection.', status: 0 };
  } else {
    // Something else happened
    return { message: error.message || 'An unexpected error occurred', status: -1 };
  }
};

export const isOnline = () => navigator.onLine;

export const createAbortController = () => {
  if (typeof AbortController !== 'undefined') {
    return new AbortController();
  }
  return null;
};

export default api;