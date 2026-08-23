import axios from 'axios';
import { toast } from 'sonner';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  timeout: 30000,
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
    const requestUrl = String(error.config?.url || '');
    const isCredentialRequest = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register');
    const hadAccessToken = Boolean(error.config?.headers?.Authorization);

    // Keep invalid-login responses on the login form. Redirect only when a
    // previously authenticated request reports an expired or invalid token.
    if (
      typeof window !== 'undefined' &&
      error.response?.status === 401 &&
      hadAccessToken &&
      !isCredentialRequest
    ) {
      localStorage.removeItem('emolearn_token');
      localStorage.removeItem('emolearn_user');
      if (window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
      return Promise.reject(error);
    }
    if (!error.response && typeof window !== 'undefined') {
      toast.error('Network error — please check your connection');
    }
    return Promise.reject(error);
  }
);

export default api;
