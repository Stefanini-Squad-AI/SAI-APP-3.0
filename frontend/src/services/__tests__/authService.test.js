import authService from '../authService';

// Mock apiClient to prevent import.meta.env resolution inside apiClient.js
jest.mock('../apiClient', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
  API_BASE_URL: 'http://localhost:5000/api'
}));

import apiClient from '../apiClient';

beforeEach(() => {
  jest.clearAllMocks();
});

// When the babel plugin replaces import.meta.env with ({}), all env variables
// resolve to undefined, so the defaults kick in:
//   USE_MOCK_AUTH = false  (VITE_ENABLE_MOCK_AUTH defaults to 'false')
//   USE_MOCK_BACKEND = false
//   → USE_MOCK_AUTH flag is false → real API path is used

describe('login – real API mode (default env)', () => {
  it('returns success on a successful API response', async () => {
    const apiData = { token: 'jwt-token', email: 'user@test.com', role: 'Admin' };
    apiClient.post.mockResolvedValue({ data: apiData });

    const result = await authService.login('user@test.com', 'Password1!');

    expect(result.success).toBe(true);
    expect(result.data).toEqual(apiData);
    expect(apiClient.post).toHaveBeenCalledWith('/auth/login', {
      email: 'user@test.com',
      password: 'Password1!'
    });
  });

  it('returns error with message from response data on API failure', async () => {
    apiClient.post.mockRejectedValue({
      response: { status: 401, data: { error: 'Invalid credentials' } }
    });

    const result = await authService.login('bad@test.com', 'wrong');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid credentials');
  });

  it('returns error with generic message when response has no error field', async () => {
    apiClient.post.mockRejectedValue({
      message: 'Network Error',
      response: undefined
    });

    const result = await authService.login('user@test.com', 'pass');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Network Error');
  });

  it('returns a specific message for HTTP 404 endpoint-not-found errors', async () => {
    apiClient.post.mockRejectedValue({
      response: { status: 404, data: {} }
    });

    const result = await authService.login('user@test.com', 'pass');

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/404/);
  });

  it('returns a specific message for HTTP 405 errors', async () => {
    apiClient.post.mockRejectedValue({
      response: { status: 405, data: {} }
    });

    const result = await authService.login('user@test.com', 'pass');

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/405/);
  });

  it('trims and lower-cases the email before sending', async () => {
    apiClient.post.mockResolvedValue({ data: {} });

    await authService.login('  USER@Test.COM  ', 'pass');

    expect(apiClient.post).toHaveBeenCalledWith(
      '/auth/login',
      expect.objectContaining({ email: '  USER@Test.COM  ' })
    );
  });
});

describe('register', () => {
  it('returns success on successful registration', async () => {
    const apiData = { id: 'u-new', email: 'new@test.com' };
    apiClient.post.mockResolvedValue({ data: apiData });

    const result = await authService.register('new@test.com', 'Pass1!', 'New User');

    expect(result.success).toBe(true);
    expect(result.data).toEqual(apiData);
    expect(apiClient.post).toHaveBeenCalledWith('/auth/register', {
      email: 'new@test.com',
      password: 'Pass1!',
      fullName: 'New User',
      role: 'Admin'
    });
  });

  it('uses the provided role', async () => {
    apiClient.post.mockResolvedValue({ data: {} });

    await authService.register('analyst@test.com', 'Pass1!', 'Analyst', 'Analista');

    expect(apiClient.post).toHaveBeenCalledWith('/auth/register', {
      email: 'analyst@test.com',
      password: 'Pass1!',
      fullName: 'Analyst',
      role: 'Analista'
    });
  });

  it('returns error on registration failure', async () => {
    apiClient.post.mockRejectedValue({
      response: { data: { error: 'Email already exists' } }
    });

    const result = await authService.register('dup@test.com', 'pass', 'Dup');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Email already exists');
  });

  it('falls back to error.message when response data has no error field', async () => {
    apiClient.post.mockRejectedValue({ message: 'Timeout', response: undefined });

    const result = await authService.register('x@test.com', 'pass', 'X');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Timeout');
  });
});
