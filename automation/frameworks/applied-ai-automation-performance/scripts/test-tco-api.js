/**
 * Performance test — TuCreditoOnline backend API
 *
 * Tests the .NET API endpoints. Requires the backend to be running.
 * Defaults to localhost; override via BASE_URL env variable for a deployed backend.
 *
 * Run: k6 run scripts/test-tco-api.js
 * Run against deployed backend: BASE_URL=https://your-api.com/api k6 run scripts/test-tco-api.js
 * Run with type: TEST_TYPE=LOAD BASE_URL=https://your-api.com/api k6 run scripts/test-tco-api.js
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

  // Public endpoint — list active credit types (used by home & services pages)
  get(`${BASE_URL}/credittypes?isActive=true`, {}, {
    'CreditTypes: status is 200': (r) => r.status === 200,
    'CreditTypes: returns an array': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body);
      } catch {
        return false;
      }
    },
  });
  sleep(1);

  // Auth endpoint — attempt login (expected 400/401 with dummy data, just measure latency)
  post(
    `${BASE_URL}/auth/login`,
    { email: 'perf-test@example.com', password: 'InvalidPassword!' },
    {},
    {
      'Auth: responds (200 or 400 or 401)': (r) =>
        r.status === 200 || r.status === 400 || r.status === 401,
    }
  );
  sleep(1);
}

export function handleSummary(data) {
  return {
    stdout: JSON.stringify(data, null, 2),
  };
}
