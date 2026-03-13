import axios from 'axios';
import secureStorage from '../utils/secureStorage';
import { isJWTExpired } from '../utils/jwtDecoder';

const normalizeApiBaseUrl = (rawBaseUrl) => {
  const fallback = 'http://localhost:5000/api';
  const base = (rawBaseUrl || fallback).trim().replace(/\/+$/, '');
  return /\/api$/i.test(base) ? base : `${base}/api`;
};

const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);

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
      if (!globalThis.location.pathname.includes('/admin/login')) {
        globalThis.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
