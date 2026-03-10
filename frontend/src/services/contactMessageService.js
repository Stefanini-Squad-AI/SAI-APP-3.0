import apiClient from './apiClient';

const API_URL = '/contactmessages';

// Status enum: 0=New, 1=InProgress, 2=Replied, 3=Closed
const contactMessageService = {
  async create(messageData) {
    try {
      const response = await apiClient.post(API_URL, messageData);
      return response.data;
    } catch (error) {
      console.error('Error sending contact message:', error);
      throw error;
    }
  },

  /**
   * @param {number|null} status - Filter by status (0=New, 1=InProgress, 2=Replied, 3=Closed)
   */
  async getAll(status = null) {
    try {
      const params = status !== null ? { status } : {};
      const response = await apiClient.get(API_URL, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  },

  async getById(id) {
    try {
      const response = await apiClient.get(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching message ${id}:`, error);
      throw error;
    }
  },

  /**
   * @param {string} id
   * @param {number} status - New status (0=New, 1=InProgress, 2=Replied, 3=Closed)
   * @param {string} adminNotes - Optional admin notes
   */
  async updateStatus(id, status, adminNotes = null) {
    try {
      const data = { id, status };
      if (adminNotes) data.adminNotes = adminNotes;
      const response = await apiClient.patch(`${API_URL}/${id}/status`, data);
      return response.data;
    } catch (error) {
      console.error(`Error updating message status ${id}:`, error);
      throw error;
    }
  },

  async delete(id) {
    try {
      const response = await apiClient.delete(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting message ${id}:`, error);
      throw error;
    }
  },

  getStatusText(status) {
    const statusMap = {
      0: 'New',
      1: 'In Progress',
      2: 'Replied',
      3: 'Closed'
    };
    return statusMap[status] || 'Unknown';
  },

  getStatusColor(status) {
    const colorMap = {
      0: 'bg-blue-100 text-blue-800',
      1: 'bg-yellow-100 text-yellow-800',
      2: 'bg-green-100 text-green-800',
      3: 'bg-gray-100 text-gray-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  },

  isValidTransition(currentStatus, nextStatus) {
    const validTransitions = {
      0: [1, 2],
      1: [2, 3],
      2: [3],
      3: []
    };
    return validTransitions[currentStatus]?.includes(nextStatus) || false;
  },

  getNextStatusOptions(currentStatus) {
    const options = {
      0: [
        { value: 1, label: 'Mark In Progress' },
        { value: 2, label: 'Mark Replied' }
      ],
      1: [
        { value: 2, label: 'Mark Replied' },
        { value: 3, label: 'Close' }
      ],
      2: [
        { value: 3, label: 'Close' }
      ],
      3: []
    };
    return options[currentStatus] || [];
  }
};

export default contactMessageService;
