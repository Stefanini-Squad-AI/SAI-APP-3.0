import {
  sanitizeHtml,
  sanitizeString,
  sanitizeEmail,
  sanitizePhoneNumber,
  sanitizeNumber,
  containsSuspiciousPatterns,
  sanitizeObject,
  escapeHtml,
  sanitizeUrl,
} from '../inputSanitizer';

describe('sanitizeHtml', () => {
  it('returns empty string for null input', () => {
    expect(sanitizeHtml(null)).toBe('');
  });

  it('returns empty string for undefined input', () => {
    expect(sanitizeHtml(undefined)).toBe('');
  });

  it('returns empty string for non-string input', () => {
    expect(sanitizeHtml(42)).toBe('');
  });

  it('passes through plain text unchanged', () => {
    expect(sanitizeHtml('hello world')).toBe('hello world');
  });

  it('encodes HTML angle brackets', () => {
    const result = sanitizeHtml('<script>alert(1)</script>');
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;');
  });

  it('handles ampersands', () => {
    const result = sanitizeHtml('a & b');
    expect(result).toContain('&amp;');
  });
});

describe('sanitizeString', () => {
  it('returns empty string for null', () => {
    expect(sanitizeString(null)).toBe('');
  });

  it('returns empty string for non-string', () => {
    expect(sanitizeString(123)).toBe('');
  });

  it('trims leading/trailing whitespace', () => {
    expect(sanitizeString('  hello  ')).toBe('hello');
  });

  it('strips HTML tags', () => {
    const result = sanitizeString('<b>bold</b>');
    expect(result).not.toContain('<b>');
    expect(result).not.toContain('</b>');
  });

  it('removes control characters (except tab/newline)', () => {
    // ASCII 1 (SOH) should be removed
    const withControl = 'hello\x01world';
    const result = sanitizeString(withControl);
    expect(result).toBe('helloworld');
  });

  it('keeps tab characters', () => {
    expect(sanitizeString('a\tb')).toBe('a\tb');
  });

  it('keeps newline characters', () => {
    expect(sanitizeString('a\nb')).toBe('a\nb');
  });

  it('returns clean plain text unchanged', () => {
    expect(sanitizeString('John Doe')).toBe('John Doe');
  });
});

describe('sanitizeEmail', () => {
  it('returns empty string for null', () => {
    expect(sanitizeEmail(null)).toBe('');
  });

  it('returns empty string for non-string', () => {
    expect(sanitizeEmail(42)).toBe('');
  });

  it('returns empty string for invalid email', () => {
    expect(sanitizeEmail('not-an-email')).toBe('');
  });

  it('returns empty string for email missing domain', () => {
    expect(sanitizeEmail('user@')).toBe('');
  });

  it('returns normalised lowercase for valid email', () => {
    expect(sanitizeEmail('User@Example.COM')).toBe('user@example.com');
  });

  it('accepts standard email format', () => {
    expect(sanitizeEmail('test.user+tag@sub.domain.org')).toBe('test.user+tag@sub.domain.org');
  });
});

describe('sanitizePhoneNumber', () => {
  it('returns empty string for null', () => {
    expect(sanitizePhoneNumber(null)).toBe('');
  });

  it('removes non-digit characters', () => {
    expect(sanitizePhoneNumber('+1 (555) 123-4567')).toBe('15551234567');
  });

  it('leaves digits untouched', () => {
    expect(sanitizePhoneNumber('5551234567')).toBe('5551234567');
  });

  it('handles empty string', () => {
    expect(sanitizePhoneNumber('')).toBe('');
  });
});

describe('sanitizeNumber', () => {
  it('parses a valid number string', () => {
    expect(sanitizeNumber('42')).toBe(42);
  });

  it('returns min for NaN input', () => {
    expect(sanitizeNumber('abc', 0)).toBe(0);
  });

  it('clamps to min when value is below range', () => {
    expect(sanitizeNumber(-10, 0, 100)).toBe(0);
  });

  it('clamps to max when value exceeds range', () => {
    expect(sanitizeNumber(200, 0, 100)).toBe(100);
  });

  it('returns value when within range', () => {
    expect(sanitizeNumber(50, 0, 100)).toBe(50);
  });

  it('handles numeric input directly', () => {
    expect(sanitizeNumber(3.14, 0, 10)).toBe(3.14);
  });

  it('uses 0 as default min', () => {
    expect(sanitizeNumber(-5)).toBe(0);
  });
});

describe('containsSuspiciousPatterns', () => {
  it('returns false for null', () => {
    expect(containsSuspiciousPatterns(null)).toBe(false);
  });

  it('returns false for non-string', () => {
    expect(containsSuspiciousPatterns(42)).toBe(false);
  });

  it('returns false for clean text', () => {
    expect(containsSuspiciousPatterns('Hello World')).toBe(false);
  });

  it('detects <script tags', () => {
    expect(containsSuspiciousPatterns('<script>alert(1)</script>')).toBe(true);
  });

  it('detects javascript: protocol', () => {
    expect(containsSuspiciousPatterns('javascript:void(0)')).toBe(true);
  });

  it('detects onerror= handlers', () => {
    expect(containsSuspiciousPatterns('<img onerror=alert(1)>')).toBe(true);
  });

  it('detects onclick= handlers', () => {
    expect(containsSuspiciousPatterns('<div onclick=alert(1)>')).toBe(true);
  });

  it('detects onload= handlers', () => {
    expect(containsSuspiciousPatterns('<body onload=alert(1)>')).toBe(true);
  });

  it('detects eval(', () => {
    expect(containsSuspiciousPatterns('eval(malicious)')).toBe(true);
  });

  it('detects expression(', () => {
    expect(containsSuspiciousPatterns('expression(1+1)')).toBe(true);
  });

  it('detects vbscript:', () => {
    expect(containsSuspiciousPatterns('vbscript:msgbox(1)')).toBe(true);
  });

  it('detects data:text/html', () => {
    expect(containsSuspiciousPatterns('data:text/html,<h1>x</h1>')).toBe(true);
  });
});

describe('sanitizeObject', () => {
  it('returns non-object input unchanged', () => {
    expect(sanitizeObject(null)).toBe(null);
    expect(sanitizeObject('string')).toBe('string');
  });

  it('sanitizes string properties', () => {
    const result = sanitizeObject({ name: '  John  ', role: '<script>' });
    expect(result.name).toBe('John');
    expect(result.role).not.toContain('<script>');
  });

  it('preserves number properties', () => {
    const result = sanitizeObject({ age: 30 });
    expect(result.age).toBe(30);
  });

  it('recursively sanitizes nested objects', () => {
    const result = sanitizeObject({ outer: { inner: '<b>hi</b>' } });
    expect(result.outer.inner).not.toContain('<b>');
  });

  it('preserves boolean/undefined/null values', () => {
    const result = sanitizeObject({ flag: true, nothing: null, missing: undefined });
    expect(result.flag).toBe(true);
    expect(result.nothing).toBe(null);
    expect(result.missing).toBe(undefined);
  });
});

describe('escapeHtml', () => {
  it('returns empty string for null', () => {
    expect(escapeHtml(null)).toBe('');
  });

  it('escapes &', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b');
  });

  it('escapes <', () => {
    expect(escapeHtml('<tag>')).toContain('&lt;');
  });

  it('escapes >', () => {
    expect(escapeHtml('<tag>')).toContain('&gt;');
  });

  it('escapes "', () => {
    expect(escapeHtml('"quoted"')).toContain('&quot;');
  });

  it("escapes '", () => {
    expect(escapeHtml("it's")).toContain('&#x27;');
  });

  it('escapes /', () => {
    expect(escapeHtml('a/b')).toContain('&#x2F;');
  });

  it('leaves plain text unchanged', () => {
    expect(escapeHtml('Hello World')).toBe('Hello World');
  });
});

describe('sanitizeUrl', () => {
  it('returns empty string for null', () => {
    expect(sanitizeUrl(null)).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(sanitizeUrl('')).toBe('');
  });

  it('blocks javascript: protocol', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBe('');
  });

  it('blocks data: protocol', () => {
    expect(sanitizeUrl('data:text/html,<h1>x</h1>')).toBe('');
  });

  it('blocks vbscript: protocol', () => {
    expect(sanitizeUrl('vbscript:msgbox(1)')).toBe('');
  });

  it('blocks file: protocol', () => {
    expect(sanitizeUrl('file:///etc/passwd')).toBe('');
  });

  it('allows http URLs', () => {
    expect(sanitizeUrl('http://example.com/path')).toBe('http://example.com/path');
  });

  it('allows https URLs', () => {
    expect(sanitizeUrl('https://example.com')).toBe('https://example.com');
  });

  it('trims surrounding whitespace', () => {
    expect(sanitizeUrl('  https://example.com  ')).toBe('https://example.com');
  });
});
