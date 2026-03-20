import apiClient from './apiClient';

const serviceService = {
  getAll: async (isActive = null) => {
    try {
      const params = isActive === null ? {} : { isActive };
      const response = await apiClient.get('/services', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching services:', error);
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const response = await apiClient.get(`/services/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching service:', error);
      throw error;
    }
  },

  create: async (serviceData) => {
    try {
      const response = await apiClient.post('/services', serviceData);
      return response.data;
    } catch (error) {
      console.error('Error creating service:', error);
      throw error;
    }
  },

  update: async (id, serviceData) => {
    try {
      const response = await apiClient.put(`/services/${id}`, serviceData);
      return response.data;
    } catch (error) {
      console.error('Error updating service:', error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await apiClient.delete(`/services/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting service:', error);
      throw error;
    }
  },
};

export default serviceService;
