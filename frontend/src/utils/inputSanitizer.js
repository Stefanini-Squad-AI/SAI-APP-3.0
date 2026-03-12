/**
 * Input sanitization utilities for frontend
 * Prevents XSS and injection attacks
 */

/**
 * Sanitize HTML content by removing all HTML tags
 */
export const sanitizeHtml = (input) => {
  if (!input || typeof input !== 'string') return '';
  
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
};

/**
 * Sanitize string input by removing potentially dangerous characters
 */
export const sanitizeString = (input) => {
  if (!input || typeof input !== 'string') return '';
  
  // Remove HTML tags
  let sanitized = sanitizeHtml(input);
  
  // Remove control characters except newline and tab
  sanitized = [...sanitized]
    .filter((char) => {
      const code = char.codePointAt(0) ?? 0;
      const isControl = code >= 0 && code <= 31;
      return !isControl || code === 9 || code === 10;
    })
    .join('');
  
  // Trim whitespace
  return sanitized.trim();
};

/**
 * Validate and sanitize email address
 */
export const sanitizeEmail = (email) => {
  if (!email || typeof email !== 'string') return '';
  
  const sanitized = sanitizeString(email).toLowerCase();
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) return '';
  
  return sanitized;
};

/**
 * Sanitize phone number (remove non-digit characters)
 */
export const sanitizePhoneNumber = (phone) => {
  if (!phone || typeof phone !== 'string') return '';
  
  // Remove all non-digit characters
  return phone.replaceAll(/\D/g, '');
};

/**
 * Sanitize numeric input
 */
export const sanitizeNumber = (value, min = 0, max = Number.MAX_SAFE_INTEGER) => {
  const num = Number.parseFloat(value);
  if (Number.isNaN(num)) return min;
  if (num < min) return min;
  if (num > max) return max;
  return num;
};

/**
 * Check if input contains suspicious patterns
 */
export const containsSuspiciousPatterns = (input) => {
  if (!input || typeof input !== 'string') return false;
  
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /onerror=/i,
    /onclick=/i,
    /onload=/i,
    /eval\(/i,
    /expression\(/i,
    /vbscript:/i,
    /data:text\/html/i
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(input));
};

/**
 * Sanitize object by sanitizing all string properties
 */
export const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'number') {
      sanitized[key] = value;
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

/**
 * Escape HTML entities
 */
export const escapeHtml = (text) => {
  if (!text || typeof text !== 'string') return '';
  
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  return text.replaceAll(/[&<>"'/]/g, (char) => map[char]);
};

/**
 * Validate URL to prevent javascript: and data: protocols
 */
export const sanitizeUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  
  const sanitized = url.trim().toLowerCase();
  
  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  if (dangerousProtocols.some(protocol => sanitized.startsWith(protocol))) {
    return '';
  }
  
  return url.trim();
};

export default {
  sanitizeHtml,
  sanitizeString,
  sanitizeEmail,
  sanitizePhoneNumber,
  sanitizeNumber,
  containsSuspiciousPatterns,
  sanitizeObject,
  escapeHtml,
  sanitizeUrl
};
