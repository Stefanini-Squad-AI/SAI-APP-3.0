/**
 * Secure storage utility for sensitive data
 * Only stores tokens and essential auth data
 */

const ALLOWED_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  TOKEN_EXPIRY: 'token_expiry'
};

class SecureStorage {
  constructor() {
    this.storage = localStorage;
    this.cleanupOldData();
  }

  /**
   * Clean up any unauthorized or old data from localStorage
   */
  cleanupOldData() {
    const allowedValues = Object.values(ALLOWED_KEYS);
    const keysToRemove = [];

    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key && !allowedValues.includes(key)) {
        // Remove any key that's not in our allowed list
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => {
      console.warn(`Removing unauthorized key from localStorage: ${key}`);
      this.storage.removeItem(key);
    });
  }

  /**
   * Sanitize input to prevent XSS
   */
  sanitizeInput(value) {
    if (typeof value !== 'string') return value;
    
    // Remove any HTML tags
    return value.replaceAll(/<[^>]*>/g, '');
  }

  /**
   * Validate that the key is allowed
   */
  isAllowedKey(key) {
    return Object.values(ALLOWED_KEYS).includes(key);
  }

  /**
   * Set item in secure storage
   */
  setItem(key, value) {
    if (!this.isAllowedKey(key)) {
      console.error(`Attempted to store unauthorized key: ${key}`);
      return false;
    }

    try {
      const sanitizedValue = this.sanitizeInput(value);
      this.storage.setItem(key, sanitizedValue);
      return true;
    } catch (error) {
      console.error('Error storing data:', error);
      return false;
    }
  }

  /**
   * Get item from secure storage
   */
  getItem(key) {
    if (!this.isAllowedKey(key)) {
      console.error(`Attempted to access unauthorized key: ${key}`);
      return null;
    }

    try {
      return this.storage.getItem(key);
    } catch (error) {
      console.error('Error retrieving data:', error);
      return null;
    }
  }

  /**
   * Remove item from secure storage
   */
  removeItem(key) {
    if (!this.isAllowedKey(key)) {
      console.error(`Attempted to remove unauthorized key: ${key}`);
      return false;
    }

    try {
      this.storage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing data:', error);
      return false;
    }
  }

  /**
   * Clear all secure storage
   */
  clear() {
    try {
      Object.values(ALLOWED_KEYS).forEach(key => {
        this.storage.removeItem(key);
      });
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  }

  /**
   * Store authentication token
   */
  setAuthToken(token) {
    return this.setItem(ALLOWED_KEYS.AUTH_TOKEN, token);
  }

  /**
   * Get authentication token
   */
  getAuthToken() {
    return this.getItem(ALLOWED_KEYS.AUTH_TOKEN);
  }

  /**
   * Store refresh token
   */
  setRefreshToken(token) {
    return this.setItem(ALLOWED_KEYS.REFRESH_TOKEN, token);
  }

  /**
   * Get refresh token
   */
  getRefreshToken() {
    return this.getItem(ALLOWED_KEYS.REFRESH_TOKEN);
  }

  /**
   * Store token expiry time
   */
  setTokenExpiry(expiry) {
    return this.setItem(ALLOWED_KEYS.TOKEN_EXPIRY, expiry);
  }

  /**
   * Get token expiry time
   */
  getTokenExpiry() {
    return this.getItem(ALLOWED_KEYS.TOKEN_EXPIRY);
  }

  /**
   * Check if token is expired
   */
  isTokenExpired() {
    const expiry = this.getTokenExpiry();
    if (!expiry) return false;

    try {
      const expiryDate = new Date(expiry);
      const now = new Date();
      return expiryDate <= now;
    } catch (error) {
      console.error('Error checking token expiry:', error);
      return false;
    }
  }

  /**
   * Clear all authentication data
   */
  clearAuth() {
    this.removeItem(ALLOWED_KEYS.AUTH_TOKEN);
    this.removeItem(ALLOWED_KEYS.REFRESH_TOKEN);
    this.removeItem(ALLOWED_KEYS.TOKEN_EXPIRY);
  }
}

// Export singleton instance
const secureStorage = new SecureStorage();
export default secureStorage;

// Export keys for reference
export { ALLOWED_KEYS };
