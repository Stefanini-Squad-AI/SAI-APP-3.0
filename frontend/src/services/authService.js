import apiClient from './apiClient';

const authService = {
  login: async (email, password) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      return { success: true, data: response.data };
    } catch (error) {
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
