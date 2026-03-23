import secureStorage, { ALLOWED_KEYS } from '../secureStorage';

// jsdom provides localStorage; reset it before each test
beforeEach(() => {
  localStorage.clear();
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('ALLOWED_KEYS', () => {
  it('exports the expected key constants', () => {
    expect(ALLOWED_KEYS.AUTH_TOKEN).toBe('auth_token');
    expect(ALLOWED_KEYS.REFRESH_TOKEN).toBe('refresh_token');
    expect(ALLOWED_KEYS.TOKEN_EXPIRY).toBe('token_expiry');
  });
});

describe('isAllowedKey', () => {
  it('returns true for allowed keys', () => {
    expect(secureStorage.isAllowedKey('auth_token')).toBe(true);
    expect(secureStorage.isAllowedKey('refresh_token')).toBe(true);
    expect(secureStorage.isAllowedKey('token_expiry')).toBe(true);
  });

  it('returns false for unknown keys', () => {
    expect(secureStorage.isAllowedKey('user_data')).toBe(false);
    expect(secureStorage.isAllowedKey('')).toBe(false);
  });
});

describe('setItem / getItem', () => {
  it('stores and retrieves a value for an allowed key', () => {
    const result = secureStorage.setItem('auth_token', 'my-token');
    expect(result).toBe(true);
    expect(secureStorage.getItem('auth_token')).toBe('my-token');
  });

  it('returns false and logs error when key is not allowed', () => {
    const result = secureStorage.setItem('evil_key', 'value');
    expect(result).toBe(false);
    expect(console.error).toHaveBeenCalled();
  });

  it('returns null and logs error when getting a disallowed key', () => {
    const result = secureStorage.getItem('evil_key');
    expect(result).toBeNull();
    expect(console.error).toHaveBeenCalled();
  });

  it('returns null when key is allowed but not yet set', () => {
    expect(secureStorage.getItem('auth_token')).toBeNull();
  });

  it('strips HTML tags from stored values (XSS prevention)', () => {
    secureStorage.setItem('auth_token', '<img src=x onerror=alert(1)>my-token');
    const stored = secureStorage.getItem('auth_token');
    expect(stored).not.toContain('<img');
    expect(stored).toContain('my-token');
  });
});

describe('removeItem', () => {
  it('removes an existing allowed key and returns true', () => {
    secureStorage.setItem('auth_token', 'tok');
    const result = secureStorage.removeItem('auth_token');
    expect(result).toBe(true);
    expect(secureStorage.getItem('auth_token')).toBeNull();
  });

  it('returns false and logs error for a disallowed key', () => {
    const result = secureStorage.removeItem('evil_key');
    expect(result).toBe(false);
    expect(console.error).toHaveBeenCalled();
  });
});

describe('clear', () => {
  it('removes all allowed keys from storage', () => {
    secureStorage.setItem('auth_token', 'tok1');
    secureStorage.setItem('refresh_token', 'tok2');
    secureStorage.setItem('token_expiry', '2026-01-01T00:00:00Z');

    const result = secureStorage.clear();
    expect(result).toBe(true);
    expect(secureStorage.getItem('auth_token')).toBeNull();
    expect(secureStorage.getItem('refresh_token')).toBeNull();
    expect(secureStorage.getItem('token_expiry')).toBeNull();
  });
});

describe('auth token helpers', () => {
  it('setAuthToken stores and getAuthToken retrieves the token', () => {
    secureStorage.setAuthToken('bearer-abc');
    expect(secureStorage.getAuthToken()).toBe('bearer-abc');
  });

  it('setRefreshToken stores and getRefreshToken retrieves the token', () => {
    secureStorage.setRefreshToken('refresh-xyz');
    expect(secureStorage.getRefreshToken()).toBe('refresh-xyz');
  });

  it('setTokenExpiry stores and getTokenExpiry retrieves the expiry', () => {
    const expiry = '2027-01-01T00:00:00Z';
    secureStorage.setTokenExpiry(expiry);
    expect(secureStorage.getTokenExpiry()).toBe(expiry);
  });
});

describe('isTokenExpired', () => {
  it('returns false when no expiry is stored', () => {
    expect(secureStorage.isTokenExpired()).toBe(false);
  });

  it('returns true when the expiry date is in the past', () => {
    secureStorage.setTokenExpiry(new Date(Date.now() - 60_000).toISOString());
    expect(secureStorage.isTokenExpired()).toBe(true);
  });

  it('returns false when the expiry date is in the future', () => {
    secureStorage.setTokenExpiry(new Date(Date.now() + 60_000).toISOString());
    expect(secureStorage.isTokenExpired()).toBe(false);
  });
});

describe('clearAuth', () => {
  it('removes auth_token, refresh_token, and token_expiry', () => {
    secureStorage.setAuthToken('tok');
    secureStorage.setRefreshToken('ref');
    secureStorage.setTokenExpiry('2027-01-01T00:00:00Z');

    secureStorage.clearAuth();

    expect(secureStorage.getAuthToken()).toBeNull();
    expect(secureStorage.getRefreshToken()).toBeNull();
    expect(secureStorage.getTokenExpiry()).toBeNull();
  });
});

describe('cleanupOldData', () => {
  it('removes unauthorized keys that were placed in localStorage externally', () => {
    // Bypass secureStorage and write directly to localStorage
    localStorage.setItem('unauthorized_key', 'bad-value');
    // Creating a new instance triggers cleanupOldData in the constructor
    // We test by calling it on the singleton directly
    secureStorage.cleanupOldData();
    expect(localStorage.getItem('unauthorized_key')).toBeNull();
  });
});
