/**
 * Performance test — TuCreditoOnline GitHub Pages home page
 *
 * Tests the static GitHub Pages deployment at the root URL.
 * Run: k6 run scripts/test-tco-homepage.js
 * Run with type: TEST_TYPE=LOAD k6 run scripts/test-tco-homepage.js
 */

import { sleep } from 'k6';
import { get } from '../helpers/httpMethods.js';
import { getTestConfig } from '../config/test-types.js';

const BASE_URL = __ENV.BASE_URL || 'https://stefanini-squad-ai.github.io/SAI-APP-3.0';

const testConfig = getTestConfig(__ENV.TEST_TYPE || 'PERFORMANCE');

export const options = testConfig.options;

export default function () {
  // Home page
  get(`${BASE_URL}/`);
  sleep(1);

  // About page
  get(`${BASE_URL}/about`);
  sleep(1);

  // Services page
  get(`${BASE_URL}/services`);
  sleep(1);

  // Calculator page
  get(`${BASE_URL}/calculator`);
  sleep(1);

  // FAQ page
  get(`${BASE_URL}/faq`);
  sleep(1);

  // Contact page
  get(`${BASE_URL}/contact`);
  sleep(1);
}

export function handleSummary(data) {
  return {
    stdout: JSON.stringify(data, null, 2),
  };
}
