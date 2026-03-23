import serviceService from '../serviceService';

jest.mock('../apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
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

describe('getAll', () => {
  it('returns all services with no filter', async () => {
    const list = [{ id: 'svc-1', title: 'Personal Credit' }];
    apiClient.get.mockResolvedValue({ data: list });

    const result = await serviceService.getAll();

    expect(result).toEqual(list);
    expect(apiClient.get).toHaveBeenCalledWith('/services', { params: {} });
  });

  it('passes isActive filter when provided', async () => {
    apiClient.get.mockResolvedValue({ data: [] });

    await serviceService.getAll(true);

    expect(apiClient.get).toHaveBeenCalledWith('/services', { params: { isActive: true } });
  });

  it('throws and logs on failure', async () => {
    const err = new Error('Network error');
    apiClient.get.mockRejectedValue(err);

    await expect(serviceService.getAll()).rejects.toThrow('Network error');
    expect(console.error).toHaveBeenCalled();
  });
});

describe('getById', () => {
  it('returns service data on success', async () => {
    const svc = { id: 'svc-1', title: 'Express Credit' };
    apiClient.get.mockResolvedValue({ data: svc });

    const result = await serviceService.getById('svc-1');

    expect(result).toEqual(svc);
    expect(apiClient.get).toHaveBeenCalledWith('/services/svc-1');
  });

  it('throws and logs on failure', async () => {
    apiClient.get.mockRejectedValue(new Error('Not found'));

    await expect(serviceService.getById('svc-99')).rejects.toThrow('Not found');
    expect(console.error).toHaveBeenCalled();
  });
});

describe('create', () => {
  it('creates a service and returns response data', async () => {
    const created = { id: 'svc-2', title: 'New Service' };
    apiClient.post.mockResolvedValue({ data: created });

    const result = await serviceService.create({ title: 'New Service' });

    expect(result).toEqual(created);
    expect(apiClient.post).toHaveBeenCalledWith('/services', { title: 'New Service' });
  });

  it('throws and logs on failure', async () => {
    apiClient.post.mockRejectedValue(new Error('Validation error'));

    await expect(serviceService.create({})).rejects.toThrow('Validation error');
    expect(console.error).toHaveBeenCalled();
  });
});

describe('update', () => {
  it('updates a service and returns response data', async () => {
    const updated = { id: 'svc-1', title: 'Updated Service' };
    apiClient.put.mockResolvedValue({ data: updated });

    const result = await serviceService.update('svc-1', { title: 'Updated Service' });

    expect(result).toEqual(updated);
    expect(apiClient.put).toHaveBeenCalledWith('/services/svc-1', { title: 'Updated Service' });
  });

  it('throws and logs on failure', async () => {
    apiClient.put.mockRejectedValue(new Error('Server error'));

    await expect(serviceService.update('svc-1', {})).rejects.toThrow('Server error');
    expect(console.error).toHaveBeenCalled();
  });
});

describe('delete', () => {
  it('deletes a service and returns response data', async () => {
    apiClient.delete.mockResolvedValue({ data: true });

    const result = await serviceService.delete('svc-1');

    expect(result).toBe(true);
    expect(apiClient.delete).toHaveBeenCalledWith('/services/svc-1');
  });

  it('throws and logs on failure', async () => {
    apiClient.delete.mockRejectedValue(new Error('Not found'));

    await expect(serviceService.delete('svc-99')).rejects.toThrow('Not found');
    expect(console.error).toHaveBeenCalled();
  });
});
