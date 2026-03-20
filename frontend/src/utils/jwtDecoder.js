/**
 * JWT Decoder utility
 * Decodes JWT tokens to extract user information
 */

/**
 * Decode JWT token payload
 * @param {string} token - JWT token
 * @returns {object|null} Decoded payload or null if invalid
 */
export const decodeJWT = (token) => {
  if (!token) return null;

  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Invalid JWT format');
      return null;
    }

    // Decode the payload (second part)
    const payload = parts[1];
    
    // Base64 URL decode
    const base64 = payload.replaceAll('-', '+').replaceAll('_', '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.codePointAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

/**
 * Extract user data from JWT token
 * @param {string} token - JWT token
 * @returns {object|null} User data or null if invalid
 */
export const extractUserFromToken = (token) => {
  const payload = decodeJWT(token);
  if (!payload) return null;

  try {
    // Extract user information from JWT claims
    return {
      id: payload.sub || payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'],
      email: payload.email || payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'],
      fullName: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || payload.name,
      role: payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || payload.role,
    };
  } catch (error) {
    console.error('Error extracting user from token:', error);
    return null;
  }
};

/**
 * Check if JWT token is expired
 * @param {string} token - JWT token
 * @returns {boolean} True if expired, false otherwise
 */
export const isJWTExpired = (token) => {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) return true;

  // exp is in seconds, Date.now() is in milliseconds
  const expirationTime = payload.exp * 1000;
  return Date.now() >= expirationTime;
};

export default {
  decodeJWT,
  extractUserFromToken,
  isJWTExpired,
};
