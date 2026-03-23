import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';

// Mock secureStorage so tests don't touch real localStorage
jest.mock('../../utils/secureStorage', () => ({
  __esModule: true,
  default: {
    getAuthToken: jest.fn(),
    setAuthToken: jest.fn(),
    setTokenExpiry: jest.fn(),
    clearAuth: jest.fn(),
  }
}));

// Mock jwtDecoder
jest.mock('../../utils/jwtDecoder', () => ({
  __esModule: true,
  extractUserFromToken: jest.fn(),
  isJWTExpired: jest.fn(),
}));

import secureStorage from '../../utils/secureStorage';
import { extractUserFromToken, isJWTExpired } from '../../utils/jwtDecoder';

// Helper component that reads the context value
const Consumer = ({ onValue }) => {
  const auth = useAuth();
  onValue(auth);
  return null;
};

const renderWithAuth = (onValue) =>
  render(
    <AuthProvider>
      <Consumer onValue={onValue} />
    </AuthProvider>
  );

beforeEach(() => {
  jest.clearAllMocks();
});

describe('AuthProvider – initial state with no stored token', () => {
  it('starts with user=null, token=null, loading=false after mount', async () => {
    secureStorage.getAuthToken.mockReturnValue(null);

    let captured;
    await act(async () => {
      renderWithAuth((v) => { captured = v; });
    });

    expect(captured.user).toBeNull();
    expect(captured.token).toBeNull();
    expect(captured.loading).toBe(false);
  });
});

describe('AuthProvider – initial state with valid stored token', () => {
  it('restores user from a valid, non-expired stored token', async () => {
    const fakeToken = 'valid.jwt.token';
    const fakeUser = { id: 'u1', email: 'user@test.com', fullName: 'Test User', role: 'Admin' };

    secureStorage.getAuthToken.mockReturnValue(fakeToken);
    isJWTExpired.mockReturnValue(false);
    extractUserFromToken.mockReturnValue(fakeUser);

    let captured;
    await act(async () => {
      renderWithAuth((v) => { captured = v; });
    });

    expect(captured.user).toEqual(fakeUser);
    expect(captured.token).toBe(fakeToken);
    expect(captured.loading).toBe(false);
  });
});

describe('AuthProvider – initial state with expired token', () => {
  it('clears auth and sets user=null when stored token is expired', async () => {
    secureStorage.getAuthToken.mockReturnValue('expired.jwt.token');
    isJWTExpired.mockReturnValue(true);

    let captured;
    await act(async () => {
      renderWithAuth((v) => { captured = v; });
    });

    expect(secureStorage.clearAuth).toHaveBeenCalled();
    expect(captured.user).toBeNull();
  });
});

describe('AuthProvider – initial state when extractUserFromToken returns null', () => {
  it('clears auth when token is valid but user extraction fails', async () => {
    secureStorage.getAuthToken.mockReturnValue('valid.jwt.token');
    isJWTExpired.mockReturnValue(false);
    extractUserFromToken.mockReturnValue(null);

    let captured;
    await act(async () => {
      renderWithAuth((v) => { captured = v; });
    });

    expect(secureStorage.clearAuth).toHaveBeenCalled();
    expect(captured.user).toBeNull();
  });
});

describe('login()', () => {
  it('sets user and token, persists auth token to storage', async () => {
    secureStorage.getAuthToken.mockReturnValue(null);

    let captured;
    await act(async () => {
      renderWithAuth((v) => { captured = v; });
    });

    const userData = { id: 'u2', email: 'admin@test.com', fullName: 'Admin', role: 'Admin' };

    await act(async () => {
      captured.login(userData, 'new-token', '2027-01-01T00:00:00Z');
    });

    expect(captured.user).toEqual(userData);
    expect(captured.token).toBe('new-token');
    expect(secureStorage.setAuthToken).toHaveBeenCalledWith('new-token');
    expect(secureStorage.setTokenExpiry).toHaveBeenCalledWith('2027-01-01T00:00:00Z');
  });

  it('does not call setTokenExpiry when expiresAt is omitted', async () => {
    secureStorage.getAuthToken.mockReturnValue(null);

    let captured;
    await act(async () => {
      renderWithAuth((v) => { captured = v; });
    });

    await act(async () => {
      captured.login({ id: 'u3' }, 'tok', null);
    });

    expect(secureStorage.setTokenExpiry).not.toHaveBeenCalled();
  });
});

describe('logout()', () => {
  it('clears user, token, and calls clearAuth', async () => {
    const fakeToken = 'valid.jwt.token';
    const fakeUser = { id: 'u1', email: 'user@test.com', fullName: 'Test User', role: 'Admin' };

    secureStorage.getAuthToken.mockReturnValue(fakeToken);
    isJWTExpired.mockReturnValue(false);
    extractUserFromToken.mockReturnValue(fakeUser);

    let captured;
    await act(async () => {
      renderWithAuth((v) => { captured = v; });
    });

    await act(async () => {
      captured.logout();
    });

    expect(captured.user).toBeNull();
    expect(captured.token).toBeNull();
    expect(secureStorage.clearAuth).toHaveBeenCalled();
  });
});

describe('isAuthenticated()', () => {
  it('returns false when not logged in', async () => {
    secureStorage.getAuthToken.mockReturnValue(null);

    let captured;
    await act(async () => {
      renderWithAuth((v) => { captured = v; });
    });

    expect(captured.isAuthenticated()).toBe(false);
  });

  it('returns true after a successful login', async () => {
    secureStorage.getAuthToken.mockReturnValue(null);

    let captured;
    await act(async () => {
      renderWithAuth((v) => { captured = v; });
    });

    await act(async () => {
      captured.login({ id: 'u4' }, 'token', null);
    });

    expect(captured.isAuthenticated()).toBe(true);
  });
});

describe('useAuth – error outside provider', () => {
  it('throws when used outside of AuthProvider', () => {
    const ThrowingComponent = () => {
      useAuth();
      return null;
    };

    // Suppress the React error boundary console output
    jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<ThrowingComponent />)).toThrow(
      'useAuth must be used within an AuthProvider'
    );
    jest.restoreAllMocks();
  });
});
