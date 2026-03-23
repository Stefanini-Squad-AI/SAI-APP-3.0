import backupService from '../backupService';

jest.mock('../apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  }
}));

import apiClient from '../apiClient';

// Minimal DOM helpers used by generateBackup
const mockObjectUrl = 'blob:mock-url';
const mockClick = jest.fn();
const mockRemove = jest.fn();
const mockSetAttribute = jest.fn();
const mockAppendChild = jest.fn();
const mockLink = {
  href: '',
  click: mockClick,
  remove: mockRemove,
  setAttribute: mockSetAttribute,
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});

  // Mock URL.createObjectURL / revokeObjectURL
  globalThis.URL.createObjectURL = jest.fn().mockReturnValue(mockObjectUrl);
  globalThis.URL.revokeObjectURL = jest.fn();

  // Mock document.createElement to return a fake link element
  jest.spyOn(document, 'createElement').mockImplementation((tag) => {
    if (tag === 'a') return mockLink;
    return document.createElement.wrappedMethod?.(tag) ?? {};
  });

  // Mock document.body.appendChild
  jest.spyOn(document.body, 'appendChild').mockImplementation(mockAppendChild);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('generateBackup', () => {
  it('downloads the backup file and returns success', async () => {
    apiClient.get.mockResolvedValue({
      data: 'binary-content',
      headers: { 'content-disposition': 'attachment; filename=backup-2026-01-01.zip' }
    });

    const result = await backupService.generateBackup();

    expect(result.success).toBe(true);
    expect(result.message).toBe('Backup downloaded successfully');
    expect(mockClick).toHaveBeenCalled();
    expect(mockRemove).toHaveBeenCalled();
    expect(globalThis.URL.revokeObjectURL).toHaveBeenCalledWith(mockObjectUrl);
  });

  it('uses the filename from content-disposition header', async () => {
    apiClient.get.mockResolvedValue({
      data: 'data',
      headers: { 'content-disposition': 'attachment; filename=custom-backup.zip' }
    });

    await backupService.generateBackup();

    expect(mockSetAttribute).toHaveBeenCalledWith('download', 'custom-backup.zip');
  });

  it('falls back to default filename when content-disposition is missing', async () => {
    apiClient.get.mockResolvedValue({ data: 'data', headers: {} });

    await backupService.generateBackup();

    expect(mockSetAttribute).toHaveBeenCalledWith('download', 'backup_database.zip');
  });

  it('falls back to default filename when content-disposition has no filename match', async () => {
    apiClient.get.mockResolvedValue({
      data: 'data',
      headers: { 'content-disposition': 'attachment' }
    });

    await backupService.generateBackup();

    expect(mockSetAttribute).toHaveBeenCalledWith('download', 'backup_database.zip');
  });

  it('returns error on API failure', async () => {
    apiClient.get.mockRejectedValue({
      message: 'Network Error',
      response: { data: { error: 'Storage unavailable' } }
    });

    const result = await backupService.generateBackup();

    expect(result.success).toBe(false);
    expect(result.error).toBe('Storage unavailable');
    expect(console.error).toHaveBeenCalled();
  });

  it('falls back to error.message when response has no error field', async () => {
    apiClient.get.mockRejectedValue({ message: 'Timeout', response: undefined });

    const result = await backupService.generateBackup();

    expect(result.success).toBe(false);
    expect(result.error).toBe('Timeout');
  });
});

describe('getBackupStatus', () => {
  it('returns success with status data', async () => {
    const statusData = { isAvailable: true, mode: 'live' };
    apiClient.get.mockResolvedValue({ data: statusData });

    const result = await backupService.getBackupStatus();

    expect(result.success).toBe(true);
    expect(result.data).toEqual(statusData);
    expect(apiClient.get).toHaveBeenCalledWith('/backup/status');
  });

  it('returns error on failure', async () => {
    apiClient.get.mockRejectedValue({ message: 'Not found', response: undefined });

    const result = await backupService.getBackupStatus();

    expect(result.success).toBe(false);
    expect(result.error).toBe('Not found');
    expect(console.error).toHaveBeenCalled();
  });

  it('falls back to default message when error is empty', async () => {
    apiClient.get.mockRejectedValue({});

    const result = await backupService.getBackupStatus();

    expect(result.success).toBe(false);
    expect(result.error).toBe('Failed to fetch backup status');
  });
});
