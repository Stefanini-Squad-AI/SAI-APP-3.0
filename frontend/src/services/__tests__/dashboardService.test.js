import dashboardService from '../dashboardService';

jest.mock('../apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  }
}));

import apiClient from '../apiClient';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getStats', () => {
  it('returns success with dashboard stats', async () => {
    const stats = { totalCreditRequests: 10, pendingRequests: 3 };
    apiClient.get.mockResolvedValue({ data: stats });

    const result = await dashboardService.getStats();

    expect(result.success).toBe(true);
    expect(result.data).toEqual(stats);
    expect(apiClient.get).toHaveBeenCalledWith('/dashboard/stats');
  });

  it('returns error on failure', async () => {
    apiClient.get.mockRejectedValue({
      message: 'Server error',
      response: { data: { error: 'Internal error' } }
    });

    const result = await dashboardService.getStats();

    expect(result.success).toBe(false);
    expect(result.error).toBe('Internal error');
  });

  it('falls back to error.message when response has no error field', async () => {
    apiClient.get.mockRejectedValue({ message: 'Timeout', response: undefined });

    const result = await dashboardService.getStats();

    expect(result.success).toBe(false);
    expect(result.error).toBe('Timeout');
  });

  it('falls back to default message when error has no message', async () => {
    apiClient.get.mockRejectedValue({});

    const result = await dashboardService.getStats();

    expect(result.success).toBe(false);
    expect(result.error).toBe('Failed to fetch dashboard statistics');
  });
});

describe('getStatusDistribution', () => {
  it('returns success with distribution data', async () => {
    const distribution = [
      { status: 'Pending', count: 2, percentage: 50 },
      { status: 'Approved', count: 2, percentage: 50 }
    ];
    apiClient.get.mockResolvedValue({ data: distribution });

    const result = await dashboardService.getStatusDistribution();

    expect(result.success).toBe(true);
    expect(result.data).toEqual(distribution);
    expect(apiClient.get).toHaveBeenCalledWith('/dashboard/status-distribution');
  });

  it('returns error on failure', async () => {
    apiClient.get.mockRejectedValue({ message: 'Network error', response: undefined });

    const result = await dashboardService.getStatusDistribution();

    expect(result.success).toBe(false);
    expect(result.error).toBe('Network error');
  });

  it('falls back to default message when error has no message', async () => {
    apiClient.get.mockRejectedValue({});

    const result = await dashboardService.getStatusDistribution();

    expect(result.success).toBe(false);
    expect(result.error).toBe('Failed to fetch status distribution');
  });
});
