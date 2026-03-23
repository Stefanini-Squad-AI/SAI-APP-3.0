import contactMessageService from '../contactMessageService';

jest.mock('../apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
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

describe('create', () => {
  it('creates a message and returns the response data', async () => {
    const msgData = { name: 'John', email: 'john@test.com', subject: 'Hi', message: 'Hello' };
    const created = { id: 'msg-1', ...msgData, status: 0 };
    apiClient.post.mockResolvedValue({ data: created });

    const result = await contactMessageService.create(msgData);

    expect(result).toEqual(created);
    expect(apiClient.post).toHaveBeenCalledWith('/contactmessages', msgData);
  });

  it('returns a demo object when the backend is unreachable', async () => {
    apiClient.post.mockRejectedValue(new Error('Network error'));

    const msgData = { name: 'Jane', email: 'jane@test.com', subject: 'Q', message: 'Help' };
    const result = await contactMessageService.create(msgData);

    expect(result._demo).toBe(true);
    expect(result.status).toBe(0);
    expect(result.name).toBe('Jane');
  });
});

describe('getAll', () => {
  it('fetches all messages without status filter', async () => {
    const list = [{ id: 'msg-1' }];
    apiClient.get.mockResolvedValue({ data: list });

    const result = await contactMessageService.getAll();

    expect(result).toEqual(list);
    expect(apiClient.get).toHaveBeenCalledWith('/contactmessages', { params: {} });
  });

  it('fetches messages filtered by status', async () => {
    const list = [{ id: 'msg-2', status: 1 }];
    apiClient.get.mockResolvedValue({ data: list });

    const result = await contactMessageService.getAll(1);

    expect(result).toEqual(list);
    expect(apiClient.get).toHaveBeenCalledWith('/contactmessages', { params: { status: 1 } });
  });

  it('throws on failure', async () => {
    const err = new Error('Server error');
    apiClient.get.mockRejectedValue(err);

    await expect(contactMessageService.getAll()).rejects.toThrow('Server error');
  });
});

describe('getById', () => {
  it('returns the message data', async () => {
    const msg = { id: 'msg-3', name: 'Bob' };
    apiClient.get.mockResolvedValue({ data: msg });

    const result = await contactMessageService.getById('msg-3');

    expect(result).toEqual(msg);
    expect(apiClient.get).toHaveBeenCalledWith('/contactmessages/msg-3');
  });

  it('throws on failure', async () => {
    apiClient.get.mockRejectedValue(new Error('Not found'));

    await expect(contactMessageService.getById('msg-99')).rejects.toThrow('Not found');
  });
});

describe('updateStatus', () => {
  it('updates status without adminNotes', async () => {
    apiClient.patch.mockResolvedValue({ data: true });

    const result = await contactMessageService.updateStatus('msg-1', 2);

    expect(result).toBe(true);
    expect(apiClient.patch).toHaveBeenCalledWith(
      '/contactmessages/msg-1/status',
      { id: 'msg-1', status: 2 }
    );
  });

  it('includes adminNotes in the payload when provided', async () => {
    apiClient.patch.mockResolvedValue({ data: true });

    await contactMessageService.updateStatus('msg-1', 3, 'Resolved');

    expect(apiClient.patch).toHaveBeenCalledWith(
      '/contactmessages/msg-1/status',
      { id: 'msg-1', status: 3, adminNotes: 'Resolved' }
    );
  });

  it('throws on failure', async () => {
    apiClient.patch.mockRejectedValue(new Error('Server error'));

    await expect(contactMessageService.updateStatus('msg-1', 1)).rejects.toThrow();
  });
});

describe('delete', () => {
  it('deletes the message', async () => {
    apiClient.delete.mockResolvedValue({ data: true });

    const result = await contactMessageService.delete('msg-1');

    expect(result).toBe(true);
    expect(apiClient.delete).toHaveBeenCalledWith('/contactmessages/msg-1');
  });

  it('throws on failure', async () => {
    apiClient.delete.mockRejectedValue(new Error('Not found'));

    await expect(contactMessageService.delete('msg-99')).rejects.toThrow();
  });
});

describe('getStatusText', () => {
  it('returns correct text for each status', () => {
    expect(contactMessageService.getStatusText(0)).toBe('New');
    expect(contactMessageService.getStatusText(1)).toBe('In Progress');
    expect(contactMessageService.getStatusText(2)).toBe('Replied');
    expect(contactMessageService.getStatusText(3)).toBe('Closed');
  });

  it('returns Unknown for an unrecognised status', () => {
    expect(contactMessageService.getStatusText(99)).toBe('Unknown');
  });
});

describe('getStatusColor', () => {
  it('returns the correct Tailwind classes for known statuses', () => {
    expect(contactMessageService.getStatusColor(0)).toContain('blue');
    expect(contactMessageService.getStatusColor(1)).toContain('yellow');
    expect(contactMessageService.getStatusColor(2)).toContain('green');
    expect(contactMessageService.getStatusColor(3)).toContain('gray');
  });

  it('returns default class for unknown status', () => {
    const result = contactMessageService.getStatusColor(99);
    expect(result).toContain('gray');
  });
});

describe('isValidTransition', () => {
  it('allows New → InProgress', () => {
    expect(contactMessageService.isValidTransition(0, 1)).toBe(true);
  });

  it('allows New → Replied', () => {
    expect(contactMessageService.isValidTransition(0, 2)).toBe(true);
  });

  it('disallows New → Closed directly', () => {
    expect(contactMessageService.isValidTransition(0, 3)).toBe(false);
  });

  it('allows InProgress → Replied', () => {
    expect(contactMessageService.isValidTransition(1, 2)).toBe(true);
  });

  it('allows InProgress → Closed', () => {
    expect(contactMessageService.isValidTransition(1, 3)).toBe(true);
  });

  it('disallows any transition from Closed', () => {
    expect(contactMessageService.isValidTransition(3, 0)).toBe(false);
    expect(contactMessageService.isValidTransition(3, 1)).toBe(false);
  });

  it('returns false for unknown current status', () => {
    expect(contactMessageService.isValidTransition(99, 1)).toBe(false);
  });
});

describe('getNextStatusOptions', () => {
  it('returns two options for New (0)', () => {
    const options = contactMessageService.getNextStatusOptions(0);
    expect(options).toHaveLength(2);
    expect(options[0].value).toBe(1);
    expect(options[1].value).toBe(2);
  });

  it('returns two options for InProgress (1)', () => {
    const options = contactMessageService.getNextStatusOptions(1);
    expect(options).toHaveLength(2);
  });

  it('returns one option for Replied (2)', () => {
    const options = contactMessageService.getNextStatusOptions(2);
    expect(options).toHaveLength(1);
    expect(options[0].value).toBe(3);
  });

  it('returns no options for Closed (3)', () => {
    expect(contactMessageService.getNextStatusOptions(3)).toHaveLength(0);
  });

  it('returns empty array for unknown status', () => {
    expect(contactMessageService.getNextStatusOptions(99)).toHaveLength(0);
  });
});
