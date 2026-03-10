import axios from 'axios';
import secureStorage from '../utils/secureStorage';
import { isJWTExpired } from '../utils/jwtDecoder';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = secureStorage.getAuthToken();
    if (token && !isJWTExpired(token)) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (token && isJWTExpired(token)) {
      secureStorage.clearAuth();
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      secureStorage.clearAuth();
      if (!window.location.pathname.includes('/admin/login')) {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
