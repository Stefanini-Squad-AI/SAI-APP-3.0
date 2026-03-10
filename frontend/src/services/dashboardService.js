import apiClient from './apiClient';

const dashboardService = {
  getStats: async () => {
    try {
      const response = await apiClient.get('/dashboard/stats');
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || error.message || 'Error al obtener estadísticas'
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
        error: error.response?.data?.error || error.message || 'Error al obtener distribución'
      };
    }
  },
};

export default dashboardService;
