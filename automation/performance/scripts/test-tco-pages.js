/**
 * K6 Performance Test — TuCreditoOnline public pages
 *
 * Simulates multi-step page navigation flows from dataset.json.
 * Target: GitHub Pages deployment (static site, no backend needed).
 *
 * Run:
 *   k6 run scripts/test-tco-pages.js
 *   TEST_TYPE=LOAD k6 run scripts/test-tco-pages.js
 *   BASE_URL=https://pr-5-tucreditoonline.surge.sh k6 run scripts/test-tco-pages.js
 */

import { sleep } from 'k6';
import { get } from '../helpers/httpMethods.js';
import { getTestConfig } from '../config/test-types.js';
import data from '../data/dataset.json';

const BASE_URL = __ENV.BASE_URL || data.baseUrl;
const testConfig = getTestConfig(__ENV.TEST_TYPE || 'PERFORMANCE');

export const options = testConfig.options;

export default function () {
  // Pick a random flow from the dataset
  const flow = data.flows[Math.floor(Math.random() * data.flows.length)];

  for (const step of flow.steps) {
    get(`${BASE_URL}${step.url}`, {}, {
      [`${step.label}: status is 200`]: (r) => r.status === 200,
      [`${step.label}: has content`]:   (r) => r.body && r.body.length > 0,
    });
    sleep(1);
  }
}

export function handleSummary(data) {
  return { stdout: JSON.stringify(data, null, 2) };
}
