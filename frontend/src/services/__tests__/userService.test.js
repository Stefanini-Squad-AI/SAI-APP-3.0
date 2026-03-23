import userService from '../userService';

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
});

describe('getAllUsers', () => {
  it('returns success with user list and default pagination', async () => {
    const response = { users: [{ id: 'u1' }], totalCount: 1, page: 1, pageSize: 10 };
    apiClient.get.mockResolvedValue({ data: response });

    const result = await userService.getAllUsers();

    expect(result.success).toBe(true);
    expect(result.data).toEqual(response);
    expect(apiClient.get).toHaveBeenCalledWith('/users', { params: { page: 1, pageSize: 10 } });
  });

  it('includes search param when provided', async () => {
    apiClient.get.mockResolvedValue({ data: { users: [] } });

    await userService.getAllUsers(2, 5, 'john');

    expect(apiClient.get).toHaveBeenCalledWith('/users', {
      params: { page: 2, pageSize: 5, search: 'john' }
    });
  });

  it('does not include search param when search is empty', async () => {
    apiClient.get.mockResolvedValue({ data: { users: [] } });

    await userService.getAllUsers(1, 10, '');

    const callParams = apiClient.get.mock.calls[0][1].params;
    expect(callParams).not.toHaveProperty('search');
  });

  it('returns error on failure', async () => {
    apiClient.get.mockRejectedValue({ message: 'Forbidden', response: null });

    const result = await userService.getAllUsers();

    expect(result.success).toBe(false);
    expect(result.error).toBe('Forbidden');
  });

  it('uses response.data.error when available', async () => {
    apiClient.get.mockRejectedValue({ response: { data: { error: 'Unauthorized' } } });

    const result = await userService.getAllUsers();

    expect(result.error).toBe('Unauthorized');
  });
});

describe('getUserById', () => {
  it('returns success with user data', async () => {
    const user = { id: 'u1', email: 'test@example.com' };
    apiClient.get.mockResolvedValue({ data: user });

    const result = await userService.getUserById('u1');

    expect(result.success).toBe(true);
    expect(result.data).toEqual(user);
    expect(apiClient.get).toHaveBeenCalledWith('/users/u1');
  });

  it('returns error on failure', async () => {
    apiClient.get.mockRejectedValue({ message: 'Not found', response: null });

    const result = await userService.getUserById('u99');

    expect(result.success).toBe(false);
  });
});

describe('createUser', () => {
  it('creates a user and returns success', async () => {
    const newUser = { id: 'u2', email: 'new@example.com' };
    apiClient.post.mockResolvedValue({ data: newUser });

    const result = await userService.createUser({ email: 'new@example.com', fullName: 'New User' });

    expect(result.success).toBe(true);
    expect(result.data).toEqual(newUser);
    expect(apiClient.post).toHaveBeenCalledWith('/users', { email: 'new@example.com', fullName: 'New User' });
  });

  it('returns error on failure', async () => {
    apiClient.post.mockRejectedValue({ message: 'Conflict', response: null });

    const result = await userService.createUser({});

    expect(result.success).toBe(false);
  });
});

describe('updateUser', () => {
  it('updates a user and returns success', async () => {
    const updated = { id: 'u1', email: 'updated@example.com' };
    apiClient.put.mockResolvedValue({ data: updated });

    const result = await userService.updateUser('u1', { email: 'updated@example.com' });

    expect(result.success).toBe(true);
    expect(result.data).toEqual(updated);
    expect(apiClient.put).toHaveBeenCalledWith('/users/u1', { email: 'updated@example.com' });
  });

  it('returns error on failure', async () => {
    apiClient.put.mockRejectedValue({ message: 'Server error', response: null });

    const result = await userService.updateUser('u1', {});

    expect(result.success).toBe(false);
  });
});

describe('deleteUser', () => {
  it('deletes a user and returns success', async () => {
    apiClient.delete.mockResolvedValue({ data: true });

    const result = await userService.deleteUser('u1');

    expect(result.success).toBe(true);
    expect(apiClient.delete).toHaveBeenCalledWith('/users/u1');
  });

  it('returns error on failure', async () => {
    apiClient.delete.mockRejectedValue({ message: 'Not found', response: null });

    const result = await userService.deleteUser('u99');

    expect(result.success).toBe(false);
  });
});

describe('changePassword', () => {
  const testNewPassword = 'NewPass123!';

  it('changes password and returns success', async () => {
    apiClient.post.mockResolvedValue({ data: true });

    const result = await userService.changePassword('u1', testNewPassword);

    expect(result.success).toBe(true);
    expect(apiClient.post).toHaveBeenCalledWith('/users/change-password', {
      userId: 'u1',
      newPassword: testNewPassword
    });
  });

  it('returns error on failure', async () => {
    apiClient.post.mockRejectedValue({ message: 'Bad request', response: null });

    const result = await userService.changePassword('u1', 'weak');

    expect(result.success).toBe(false);
  });
});
