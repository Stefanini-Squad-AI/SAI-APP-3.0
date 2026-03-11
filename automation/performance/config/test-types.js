/**
 * Configuration for different types of performance tests
 */

export const TEST_TYPES = {
    PERFORMANCE: {
        name: 'PERFORMANCE',
        description: 'Performance Test - Evaluates system behavior under normal conditions',
        options: {
            executor: 'per-vu-iterations',
            vus: 1, // 1 virtual user
            iterations: 1, // 1 iteration per user
            maxDuration: '1m', // Maximum duration
            thresholds: {
                http_req_duration: ['p(95)<3000'], // 95% of requests < 3000 ms
                http_req_failed: ['rate<0.01'], // less than 1% failures
            },
        }
    },
    LOAD: {
        name: 'LOAD',
        description: 'Load Test - Evaluates system behavior under high load',
        options: {
            executor: 'shared-iterations',
            vus: 10, // 10 virtual users
            iterations: 300, // 300 total iterations shared among VUs
            maxDuration: '30m', // Maximum duration
            thresholds: {
                http_req_duration: ['p(95)<5000'], // 95% of requests < 5000 ms
                http_req_failed: ['rate<0.05'], // less than 5% failures
            },
        }
    },
    STRESS: {
        name: 'STRESS',
        description: 'Stress Test - Determines the maximum system capacity',
        options: {
            executor: 'ramping-arrival-rate',
            startRate: 10,
            timeUnit: '1s',
            preAllocatedVUs: 50,
            maxVUs: 500,
            stages: [
                { duration: '2m', target: 50 },   // Increase to 50 req/s
                { duration: '3m', target: 100 },  // Increase to 100 req/s
                { duration: '3m', target: 200 },  // Increase to 200 req/s
                { duration: '3m', target: 300 },  // Increase to 300 req/s
                { duration: '2m', target: 0 },    // Ramp down to 0 req/s
            ],
            thresholds: {
                http_req_duration: ['p(95)<8000'], // 95% of requests < 8000 ms
                http_req_failed: ['rate<0.10'], // less than 10% failures
            },
        }
    }
};

/**
 * Gets test configuration based on test type
 * @param {string} testType - Test type (PERFORMANCE, LOAD, STRESS)
 * @returns {object} Test configuration
 */
export function getTestConfig(testType) {
    const type = testType ? testType.toUpperCase() : 'PERFORMANCE';
    return TEST_TYPES[type] || TEST_TYPES.PERFORMANCE;
}
