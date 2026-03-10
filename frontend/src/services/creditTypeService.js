import apiClient from './apiClient';
import { MOCK_CREDIT_TYPES } from './mockData';

const creditTypeService = {
  getAll: async (isActive = null) => {
    try {
      const params = isActive !== null ? { isActive } : {};
      const response = await apiClient.get('/credittypes', { params });
      return response.data;
    } catch (error) {
      // Return demo data when the backend is unreachable (e.g. GitHub Pages deployment)
      const filtered = isActive !== null
        ? MOCK_CREDIT_TYPES.filter(ct => ct.isActive === isActive)
        : MOCK_CREDIT_TYPES;
      return filtered;
    }
  },

  getById: async (id) => {
    try {
      const response = await apiClient.get(`/credittypes/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching credit type:', error);
      throw error;
    }
  },

  create: async (creditTypeData) => {
    try {
      const response = await apiClient.post('/credittypes', creditTypeData);
      return response.data;
    } catch (error) {
      console.error('Error creating credit type:', error);
      throw error;
    }
  },

  update: async (id, creditTypeData) => {
    try {
      const response = await apiClient.put(`/credittypes/${id}`, creditTypeData);
      return response.data;
    } catch (error) {
      console.error('Error updating credit type:', error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await apiClient.delete(`/credittypes/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting credit type:', error);
      throw error;
    }
  },
};

export default creditTypeService;
