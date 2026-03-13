import apiClient, { API_BASE_URL } from './apiClient';

const USE_MOCK_AUTH = String(import.meta.env.VITE_ENABLE_MOCK_AUTH || 'false').toLowerCase() === 'true';
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

const authService = {
  login: async (email, password) => {
    if (USE_MOCK_AUTH) {
      const normalizedEmail = String(email || '').trim().toLowerCase();
      const normalizedPassword = String(password || '').trim();

      if (normalizedEmail !== DEFAULT_ADMIN_EMAIL || normalizedPassword !== DEFAULT_ADMIN_PASSWORD) {
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

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
    }

    try {
      const response = await apiClient.post('/auth/login', { email, password });
      return { success: true, data: response.data };
    } catch (error) {
      const status = error.response?.status;
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
