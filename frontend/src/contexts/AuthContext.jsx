import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import secureStorage from '../utils/secureStorage';
import { extractUserFromToken, isJWTExpired } from '../utils/jwtDecoder';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = secureStorage.getAuthToken();

    if (storedToken && !isJWTExpired(storedToken)) {
      setToken(storedToken);
      const userData = extractUserFromToken(storedToken);
      if (userData) {
        setUser(userData);
      } else {
        secureStorage.clearAuth();
      }
    } else {
      secureStorage.clearAuth();
    }
    setLoading(false);
  }, []);

  const login = useCallback((userData, authToken, expiresAt) => {
    setUser(userData);
    setToken(authToken);
    secureStorage.setAuthToken(authToken);
    if (expiresAt) {
      secureStorage.setTokenExpiry(expiresAt);
    }
    // User data is intentionally kept in memory only — not persisted to localStorage
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    secureStorage.clearAuth();
  }, []);

  const isAuthenticated = useCallback(() => {
    return !!token && !!user;
  }, [token, user]);

  const value = useMemo(() => ({
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated
  }), [user, token, loading, login, logout, isAuthenticated]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
