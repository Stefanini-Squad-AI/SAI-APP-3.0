// API Configuration
const normalizeApiBaseUrl = (rawBaseUrl) => {
  const fallback = 'http://localhost:5000/api';
  const base = (rawBaseUrl || fallback).trim().replace(/\/+$/, '');
  return /\/api$/i.test(base) ? base : `${base}/api`;
};

export const API_CONFIG = {
  baseURL: normalizeApiBaseUrl(import.meta.env.VITE_API_URL),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
};

export const API_ENDPOINTS = {
  // Auth endpoints
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    refresh: '/auth/refresh-token',
    me: '/auth/me',
  },
  // Add more endpoints as needed based on User Stories
};
