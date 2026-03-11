/**
 * K6 Performance Test — TuCreditoOnline backend API
 *
 * Tests the .NET API endpoints. Requires the backend to be running.
 * Defaults to localhost; override via BASE_URL env variable.
 *
 * Run:
 *   k6 run scripts/test-tco-api.js
 *   BASE_URL=https://your-api.com/api TEST_TYPE=LOAD k6 run scripts/test-tco-api.js
 */

import { sleep } from 'k6';
import { get, post } from '../helpers/httpMethods.js';
import { getTestConfig } from '../config/test-types.js';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000/api';
const testConfig = getTestConfig(__ENV.TEST_TYPE || 'PERFORMANCE');

export const options = testConfig.options;

export default function () {
  // Health check
  get(`${BASE_URL}/health`, {}, {
    'Health: status is 200': (r) => r.status === 200,
  });
  sleep(0.5);

  // Public endpoint — active credit types (drives home & services pages)
  get(`${BASE_URL}/credittypes?isActive=true`, {}, {
    'CreditTypes: status is 200': (r) => r.status === 200,
    'CreditTypes: returns array': (r) => {
      try { return Array.isArray(JSON.parse(r.body)); } catch { return false; }
    },
  });
  sleep(1);

  // Auth endpoint — latency test (expected 400/401 with dummy credentials)
  post(
    `${BASE_URL}/auth/login`,
    { email: 'perf-test@example.com', password: 'InvalidPassword!' },
    {},
    { 'Auth: responds': (r) => [200, 400, 401].includes(r.status) }
  );
  sleep(1);
}

export function handleSummary(data) {
  return { stdout: JSON.stringify(data, null, 2) };
}
