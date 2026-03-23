import { decodeJWT, extractUserFromToken, isJWTExpired } from '../jwtDecoder';

// Helper: build a minimal valid JWT with the given payload
function buildJWT(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encode = (obj) =>
    btoa(JSON.stringify(obj)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
  return `${encode(header)}.${encode(payload)}.mock-signature`;
}

describe('decodeJWT', () => {
  it('returns null for falsy input', () => {
    expect(decodeJWT(null)).toBeNull();
    expect(decodeJWT(undefined)).toBeNull();
    expect(decodeJWT('')).toBeNull();
  });

  it('returns null for a token with wrong number of parts', () => {
    expect(decodeJWT('onlyone')).toBeNull();
    expect(decodeJWT('two.parts')).toBeNull();
    expect(decodeJWT('four.parts.here.extra')).toBeNull();
  });

  it('decodes a valid JWT and returns its payload', () => {
    const payload = { sub: 'user-1', email: 'test@example.com', role: 'Admin' };
    const token = buildJWT(payload);
    const decoded = decodeJWT(token);
    expect(decoded).not.toBeNull();
    expect(decoded.sub).toBe('user-1');
    expect(decoded.email).toBe('test@example.com');
    expect(decoded.role).toBe('Admin');
  });

  it('returns null for a token with malformed base64 payload', () => {
    // Use an invalid base64 string as the payload segment
    const token = 'validheader.!!!invalid!!!.signature';
    expect(decodeJWT(token)).toBeNull();
  });

  it('handles tokens with URL-safe base64 encoding (- and _ characters)', () => {
    const payload = { sub: 'abc', name: 'Test User' };
    const token = buildJWT(payload);
    // Ensure the token can be decoded even when base64url chars appear
    const decoded = decodeJWT(token);
    expect(decoded.sub).toBe('abc');
  });
});

describe('extractUserFromToken', () => {
  it('returns null for a falsy token', () => {
    expect(extractUserFromToken(null)).toBeNull();
  });

  it('returns null for an invalid token', () => {
    expect(extractUserFromToken('bad.token')).toBeNull();
  });

  it('extracts user data from standard JWT claims', () => {
    const payload = {
      sub: 'user-42',
      email: 'jane@example.com',
      name: 'Jane Doe',
      role: 'Analista'
    };
    const token = buildJWT(payload);
    const user = extractUserFromToken(token);
    expect(user.id).toBe('user-42');
    expect(user.email).toBe('jane@example.com');
    expect(user.fullName).toBe('Jane Doe');
    expect(user.role).toBe('Analista');
  });

  it('falls back to .NET-style claim names when standard claims are missing', () => {
    const nameIdentifier = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier';
    const emailClaim = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress';
    const nameClaim = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name';
    const roleClaim = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

    const payload = {
      [nameIdentifier]: 'dotnet-user-1',
      [emailClaim]: 'dotnet@example.com',
      [nameClaim]: 'DotNet User',
      [roleClaim]: 'Admin'
    };
    const token = buildJWT(payload);
    const user = extractUserFromToken(token);
    expect(user.id).toBe('dotnet-user-1');
    expect(user.email).toBe('dotnet@example.com');
    expect(user.fullName).toBe('DotNet User');
    expect(user.role).toBe('Admin');
  });

  it('returns null values for missing claims', () => {
    const payload = {};
    const token = buildJWT(payload);
    const user = extractUserFromToken(token);
    expect(user.id).toBeUndefined();
    expect(user.email).toBeUndefined();
  });
});

describe('isJWTExpired', () => {
  it('returns true for a falsy token', () => {
    expect(isJWTExpired(null)).toBe(true);
    expect(isJWTExpired('')).toBe(true);
  });

  it('returns true for a token without exp claim', () => {
    const payload = { sub: 'user-1' };
    const token = buildJWT(payload);
    expect(isJWTExpired(token)).toBe(true);
  });

  it('returns true for an expired token', () => {
    const pastExp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
    const payload = { sub: 'user-1', exp: pastExp };
    const token = buildJWT(payload);
    expect(isJWTExpired(token)).toBe(true);
  });

  it('returns false for a token that has not yet expired', () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
    const payload = { sub: 'user-1', exp: futureExp };
    const token = buildJWT(payload);
    expect(isJWTExpired(token)).toBe(false);
  });

  it('returns true for an invalid token', () => {
    expect(isJWTExpired('not.a.jwt')).toBe(true);
  });
});
