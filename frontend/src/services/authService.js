import apiClient, { API_BASE_URL } from './apiClient';

const RAW_API_URL = String(import.meta.env.VITE_API_URL || '').trim();
const ENABLE_MOCK_AUTH = String(import.meta.env.VITE_ENABLE_MOCK_AUTH || 'false').toLowerCase() === 'true';
const ENABLE_MOCK_BACKEND = String(import.meta.env.VITE_ENABLE_MOCK_BACKEND || 'false').toLowerCase() === 'true';
const USE_MOCK_AUTH = ENABLE_MOCK_BACKEND || (ENABLE_MOCK_AUTH && RAW_API_URL.length === 0);
const DEFAULT_ADMIN_EMAIL = (import.meta.env.VITE_DEFAULT_ADMIN_EMAIL || 'admin@tucreditoonline.local').trim().toLowerCase();
const DEFAULT_ADMIN_PASSWORD = (import.meta.env.VITE_DEFAULT_ADMIN_PASSWORD || 'Admin123!').trim();

const toBase64Url = (value) =>
  btoa(value).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');

const createMockJwt = ({ email, fullName, role }) => {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: 'mock-admin-user',
    email,
    name: fullName,
    role,
    iat: now,
    exp: now + 60 * 60 * 24 // 24h
  };

  const header = { alg: 'HS256', typ: 'JWT' };
  // Signature is a placeholder for mock mode.
  return `${toBase64Url(JSON.stringify(header))}.${toBase64Url(JSON.stringify(payload))}.mock-signature`;
};

const buildMockLoginResponse = () => {
  const token = createMockJwt({
    email: DEFAULT_ADMIN_EMAIL,
    fullName: 'System Administrator',
    role: 'Admin'
  });
  const expiresAt = new Date(Date.now() + 60 * 60 * 24 * 1000).toISOString();

  return {
    success: true,
    data: {
      token,
      email: DEFAULT_ADMIN_EMAIL,
      fullName: 'System Administrator',
      role: 'Admin',
      expiresAt
    }
  };
};

const authService = {
  login: async (email, password) => {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedPassword = String(password || '').trim();

    const canUseMockCredentials =
      normalizedEmail === DEFAULT_ADMIN_EMAIL &&
      normalizedPassword === DEFAULT_ADMIN_PASSWORD;

    if (USE_MOCK_AUTH) {
      if (!canUseMockCredentials) {
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      return buildMockLoginResponse();
    }

    try {
      const response = await apiClient.post('/auth/login', { email, password });
      return { success: true, data: response.data };
    } catch (error) {
      const status = error.response?.status;
      const isReachabilityError = !error.response || status === 404 || status === 405;

      // Fallback mode: if mock auth is enabled and backend is unreachable, allow demo login.
      if ((ENABLE_MOCK_AUTH || ENABLE_MOCK_BACKEND) && isReachabilityError && canUseMockCredentials) {
        return buildMockLoginResponse();
      }

      if (status === 404 || status === 405) {
        return {
          success: false,
          error: `Login endpoint not reachable (HTTP ${status}). Check VITE_API_URL in GitHub Secrets. Current API base: ${API_BASE_URL}`
        };
      }
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Login failed'
      };
    }
  },

  register: async (email, password, fullName, role = 'Admin') => {
    try {
      const response = await apiClient.post('/auth/register', {
        email,
        password,
        fullName,
        role
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Registration failed'
      };
    }
  }
};

export default authService;
