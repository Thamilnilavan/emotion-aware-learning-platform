import axios from 'axios';
import { toast } from 'sonner';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('emolearn_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== 'undefined' && error.response?.status === 401) {
      localStorage.removeItem('emolearn_token');
      localStorage.removeItem('emolearn_user');
      window.location.href = '/login';
      return Promise.reject(error);
    }
    if (!error.response && typeof window !== 'undefined') {
      toast.error('Network error — please check your connection');
    }
    return Promise.reject(error);
  }
);

export default api;
