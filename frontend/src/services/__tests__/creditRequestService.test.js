import creditRequestService from '../creditRequestService';

jest.mock('../apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  }
}));

import apiClient from '../apiClient';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('createCreditRequest', () => {
  it('returns success with backend response data on success', async () => {
    const mockData = { id: 'cr-1', status: 'Pending' };
    apiClient.post.mockResolvedValue({ data: mockData });

    const result = await creditRequestService.createCreditRequest({ fullName: 'John' });

    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockData);
    expect(apiClient.post).toHaveBeenCalledWith('/creditrequests', { fullName: 'John' });
  });

  it('returns a demo success object when the backend call fails', async () => {
    apiClient.post.mockRejectedValue(new Error('Network error'));

    const payload = { fullName: 'Jane', requestedAmount: 10000 };
    const result = await creditRequestService.createCreditRequest(payload);

    expect(result.success).toBe(true);
    expect(result.data._demo).toBe(true);
    expect(result.data.status).toBe('Pending');
    expect(result.data.fullName).toBe('Jane');
  });
});

describe('getAllCreditRequests', () => {
  it('returns success with list on success', async () => {
    const list = [{ id: 'cr-1' }, { id: 'cr-2' }];
    apiClient.get.mockResolvedValue({ data: list });

    const result = await creditRequestService.getAllCreditRequests();

    expect(result.success).toBe(true);
    expect(result.data).toEqual(list);
    expect(apiClient.get).toHaveBeenCalledWith('/creditrequests');
  });

  it('returns error on failure', async () => {
    apiClient.get.mockRejectedValue({ message: 'Failed', response: { data: { error: 'Not found' } } });

    const result = await creditRequestService.getAllCreditRequests();

    expect(result.success).toBe(false);
    expect(result.error).toBe('Not found');
  });
});

describe('getCreditRequestById', () => {
  it('returns success with request data on success', async () => {
    const req = { id: 'cr-5', status: 'Approved' };
    apiClient.get.mockResolvedValue({ data: req });

    const result = await creditRequestService.getCreditRequestById('cr-5');

    expect(result.success).toBe(true);
    expect(result.data).toEqual(req);
    expect(apiClient.get).toHaveBeenCalledWith('/creditrequests/cr-5');
  });

  it('returns error on failure', async () => {
    apiClient.get.mockRejectedValue({ message: 'Not found', response: null });

    const result = await creditRequestService.getCreditRequestById('cr-99');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Not found');
  });
});

describe('getCreditRequestsByStatus', () => {
  it('returns success with filtered list', async () => {
    const list = [{ id: 'cr-1', status: 'Pending' }];
    apiClient.get.mockResolvedValue({ data: list });

    const result = await creditRequestService.getCreditRequestsByStatus('Pending');

    expect(result.success).toBe(true);
    expect(apiClient.get).toHaveBeenCalledWith('/creditrequests/status/Pending');
  });

  it('returns error on failure', async () => {
    apiClient.get.mockRejectedValue({ message: 'Server error', response: null });

    const result = await creditRequestService.getCreditRequestsByStatus('Approved');

    expect(result.success).toBe(false);
  });
});

describe('approveCreditRequest', () => {
  it('calls approve endpoint and returns success', async () => {
    apiClient.post.mockResolvedValue({ data: true });

    const result = await creditRequestService.approveCreditRequest('cr-1', { remarks: 'ok' });

    expect(result.success).toBe(true);
    expect(apiClient.post).toHaveBeenCalledWith('/creditrequests/cr-1/approve', { remarks: 'ok' });
  });

  it('returns error on failure', async () => {
    apiClient.post.mockRejectedValue({ message: 'Unauthorized', response: null });

    const result = await creditRequestService.approveCreditRequest('cr-1');

    expect(result.success).toBe(false);
  });

  it('uses empty object as default for data parameter', async () => {
    apiClient.post.mockResolvedValue({ data: true });

    await creditRequestService.approveCreditRequest('cr-1');

    expect(apiClient.post).toHaveBeenCalledWith('/creditrequests/cr-1/approve', {});
  });
});

describe('rejectCreditRequest', () => {
  it('calls reject endpoint and returns success', async () => {
    apiClient.post.mockResolvedValue({ data: true });

    const result = await creditRequestService.rejectCreditRequest('cr-2', { remarks: 'no' });

    expect(result.success).toBe(true);
    expect(apiClient.post).toHaveBeenCalledWith('/creditrequests/cr-2/reject', { remarks: 'no' });
  });

  it('returns error on failure', async () => {
    apiClient.post.mockRejectedValue({ message: 'Server error', response: null });

    const result = await creditRequestService.rejectCreditRequest('cr-2');

    expect(result.success).toBe(false);
  });
});
