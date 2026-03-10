import apiClient from './apiClient';

const creditTypeService = {
  getAll: async (isActive = null) => {
    try {
      const params = isActive !== null ? { isActive } : {};
      const response = await apiClient.get('/credittypes', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching credit types:', error);
      throw error;
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
