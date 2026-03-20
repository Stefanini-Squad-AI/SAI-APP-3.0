import apiClient from './apiClient';

const backupService = {
  generateBackup: async () => {
    try {
      const response = await apiClient.get('/backup/generate', {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/zip' });
      const url = globalThis.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const contentDisposition = response.headers['content-disposition'];
      let filename = 'backup_database.zip';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
        if (filenameMatch?.[1]) filename = filenameMatch[1];
      }

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      globalThis.URL.revokeObjectURL(url);

      return { success: true, message: 'Backup downloaded successfully' };
    } catch (error) {
      console.error('Error generating backup:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to generate backup'
      };
    }
  },

  getBackupStatus: async () => {
    try {
      const response = await apiClient.get('/backup/status');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error fetching backup status:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to fetch backup status'
      };
    }
  }
};

export default backupService;
