import apiClient from './apiClient';

const userService = {
  getAllUsers: async (page = 1, pageSize = 10, search = '') => {
    try {
      const params = { page, pageSize };
      if (search) params.search = search;
      const response = await apiClient.get('/users', { params });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to fetch users'
      };
    }
  },

  getUserById: async (id) => {
    try {
      const response = await apiClient.get(`/users/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to fetch user'
      };
    }
  },

  createUser: async (userData) => {
    try {
      const response = await apiClient.post('/users', userData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to create user'
      };
    }
  },

  updateUser: async (id, userData) => {
    try {
      const response = await apiClient.put(`/users/${id}`, userData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to update user'
      };
    }
  },

  deleteUser: async (id) => {
    try {
      const response = await apiClient.delete(`/users/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to delete user'
      };
    }
  },

  changePassword: async (userId, newPassword) => {
    try {
      const response = await apiClient.post('/users/change-password', { userId, newPassword });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to change password'
      };
    }
  },
};

export default userService;
