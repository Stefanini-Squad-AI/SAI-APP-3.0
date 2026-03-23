import healthService from '../healthService';

jest.mock('../apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  }
}));

import apiClient from '../apiClient';

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('checkHealth', () => {
  it('returns health data on success', async () => {
    const healthData = { status: 'Healthy', uptime: 1000 };
    apiClient.get.mockResolvedValue({ data: healthData });

    const result = await healthService.checkHealth();

    expect(result).toEqual(healthData);
    expect(apiClient.get).toHaveBeenCalledWith('/health');
  });

  it('logs and re-throws error on failure', async () => {
    const err = new Error('Service unavailable');
    apiClient.get.mockRejectedValue(err);

    await expect(healthService.checkHealth()).rejects.toThrow('Service unavailable');
    expect(console.error).toHaveBeenCalledWith('Health check failed:', err);
  });
});
