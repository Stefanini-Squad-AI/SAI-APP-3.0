import apiClient from './apiClient';

const dashboardService = {
  getStats: async () => {
    try {
      const response = await apiClient.get('/dashboard/stats');
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || error.message || 'Failed to fetch dashboard statistics'
      };
    }
  },

  getStatusDistribution: async () => {
    try {
      const response = await apiClient.get('/dashboard/status-distribution');
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || error.message || 'Failed to fetch status distribution'
      };
    }
  },
};

export default dashboardService;
