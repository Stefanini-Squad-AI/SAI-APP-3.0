import creditTypeService from '../creditTypeService';

jest.mock('../apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  }
}));

// Mock static data so fallback tests are deterministic
jest.mock('../mockData', () => ({
  MOCK_CREDIT_TYPES: [
    { id: 'ct-1', name: 'Personal Credit', isActive: true },
    { id: 'ct-2', name: 'Express Credit', isActive: false }
  ]
}));

import apiClient from '../apiClient';

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('getAll', () => {
  it('returns all credit types when no isActive filter is given', async () => {
    const list = [{ id: 'ct-1' }, { id: 'ct-2' }];
    apiClient.get.mockResolvedValue({ data: list });

    const result = await creditTypeService.getAll();

    expect(result).toEqual(list);
    expect(apiClient.get).toHaveBeenCalledWith('/credittypes', { params: {} });
  });

  it('passes isActive filter to the API when provided', async () => {
    apiClient.get.mockResolvedValue({ data: [{ id: 'ct-1' }] });

    await creditTypeService.getAll(true);

    expect(apiClient.get).toHaveBeenCalledWith('/credittypes', { params: { isActive: true } });
  });

  it('returns all mock data when the backend is unreachable and no filter', async () => {
    apiClient.get.mockRejectedValue(new Error('Network error'));

    const result = await creditTypeService.getAll();

    expect(result).toHaveLength(2);
  });

  it('filters mock data when isActive=true and backend is unreachable', async () => {
    apiClient.get.mockRejectedValue(new Error('Network error'));

    const result = await creditTypeService.getAll(true);

    expect(result.every((ct) => ct.isActive === true)).toBe(true);
  });

  it('filters mock data when isActive=false and backend is unreachable', async () => {
    apiClient.get.mockRejectedValue(new Error('Network error'));

    const result = await creditTypeService.getAll(false);

    expect(result.every((ct) => ct.isActive === false)).toBe(true);
  });
});

describe('getById', () => {
  it('returns credit type data on success', async () => {
    const ct = { id: 'ct-1', name: 'Personal' };
    apiClient.get.mockResolvedValue({ data: ct });

    const result = await creditTypeService.getById('ct-1');

    expect(result).toEqual(ct);
    expect(apiClient.get).toHaveBeenCalledWith('/credittypes/ct-1');
  });

  it('throws and logs on failure', async () => {
    apiClient.get.mockRejectedValue(new Error('Not found'));

    await expect(creditTypeService.getById('ct-99')).rejects.toThrow('Not found');
    expect(console.error).toHaveBeenCalled();
  });
});

describe('create', () => {
  it('creates a credit type and returns the response data', async () => {
    const newCt = { id: 'ct-5', name: 'New Type' };
    apiClient.post.mockResolvedValue({ data: newCt });

    const result = await creditTypeService.create({ name: 'New Type' });

    expect(result).toEqual(newCt);
    expect(apiClient.post).toHaveBeenCalledWith('/credittypes', { name: 'New Type' });
  });

  it('throws and logs on failure', async () => {
    apiClient.post.mockRejectedValue(new Error('Validation error'));

    await expect(creditTypeService.create({})).rejects.toThrow('Validation error');
    expect(console.error).toHaveBeenCalled();
  });
});

describe('update', () => {
  it('updates a credit type and returns the response data', async () => {
    const updated = { id: 'ct-1', name: 'Updated Personal' };
    apiClient.put.mockResolvedValue({ data: updated });

    const result = await creditTypeService.update('ct-1', { name: 'Updated Personal' });

    expect(result).toEqual(updated);
    expect(apiClient.put).toHaveBeenCalledWith('/credittypes/ct-1', { name: 'Updated Personal' });
  });

  it('throws and logs on failure', async () => {
    apiClient.put.mockRejectedValue(new Error('Not found'));

    await expect(creditTypeService.update('ct-99', {})).rejects.toThrow('Not found');
    expect(console.error).toHaveBeenCalled();
  });
});

describe('delete', () => {
  it('deletes a credit type and returns the response data', async () => {
    apiClient.delete.mockResolvedValue({ data: true });

    const result = await creditTypeService.delete('ct-1');

    expect(result).toBe(true);
    expect(apiClient.delete).toHaveBeenCalledWith('/credittypes/ct-1');
  });

  it('throws and logs on failure', async () => {
    apiClient.delete.mockRejectedValue(new Error('Not found'));

    await expect(creditTypeService.delete('ct-99')).rejects.toThrow('Not found');
    expect(console.error).toHaveBeenCalled();
  });
});
