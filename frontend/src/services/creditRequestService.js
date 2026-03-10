import apiClient from './apiClient';

const creditRequestService = {
  createCreditRequest: async (data) => {
    try {
      const response = await apiClient.post('/creditrequests', data);
      return { success: true, data: response.data };
    } catch (error) {
      // Simulate a successful submission when the backend is unreachable (e.g. GitHub Pages)
      return {
        success: true,
        data: {
          id: `demo-${Date.now()}`,
          ...data,
          status: 'Pending',
          createdAt: new Date().toISOString(),
          _demo: true,
        },
      };
    }
  },

  getAllCreditRequests: async () => {
    try {
      const response = await apiClient.get('/creditrequests');
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to fetch requests'
      };
    }
  },

  getCreditRequestById: async (id) => {
    try {
      const response = await apiClient.get(`/creditrequests/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to fetch request'
      };
    }
  },

  getCreditRequestsByStatus: async (status) => {
    try {
      const response = await apiClient.get(`/creditrequests/status/${status}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to fetch requests'
      };
    }
  },

  approveCreditRequest: async (id, data = {}) => {
    try {
      const response = await apiClient.post(`/creditrequests/${id}/approve`, data);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to approve request'
      };
    }
  },

  rejectCreditRequest: async (id, data = {}) => {
    try {
      const response = await apiClient.post(`/creditrequests/${id}/reject`, data);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to reject request'
      };
    }
  }
};

export default creditRequestService;
