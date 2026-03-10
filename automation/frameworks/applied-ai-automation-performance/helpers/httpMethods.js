/**
 * HTTP Methods Helper for K6 Performance Testing
 * 
 * This module provides reusable HTTP request methods with standardized
 * error handling, validation, and status code reporting for API testing.
 */

import http from 'k6/http';
import { check } from 'k6';
import { getThreshold, isWithinThreshold } from './responseTimeThresholds.js';

/**
 * HTTP Status Code Categories and Descriptions
 */
const STATUS_CODES = {
    // 2xx Success
    200: { category: 'SUCCESS', message: 'OK - Request successful' },
    201: { category: 'SUCCESS', message: 'Created - Resource created successfully' },
    202: { category: 'SUCCESS', message: 'Accepted - Request accepted for processing' },
    204: { category: 'SUCCESS', message: 'No Content - Request successful, no content to return' },
    
    // 3xx Redirection
    301: { category: 'REDIRECT', message: 'Moved Permanently' },
    302: { category: 'REDIRECT', message: 'Found - Temporary redirect' },
    304: { category: 'REDIRECT', message: 'Not Modified - Cached version is current' },
    
    // 4xx Client Errors
    400: { category: 'CLIENT_ERROR', message: 'Bad Request - Invalid request syntax' },
    401: { category: 'CLIENT_ERROR', message: 'Unauthorized - Authentication required' },
    403: { category: 'CLIENT_ERROR', message: 'Forbidden - Access denied' },
    404: { category: 'CLIENT_ERROR', message: 'Not Found - Resource does not exist' },
    405: { category: 'CLIENT_ERROR', message: 'Method Not Allowed' },
    408: { category: 'CLIENT_ERROR', message: 'Request Timeout' },
    409: { category: 'CLIENT_ERROR', message: 'Conflict - Request conflicts with current state' },
    422: { category: 'CLIENT_ERROR', message: 'Unprocessable Entity - Validation failed' },
    429: { category: 'CLIENT_ERROR', message: 'Too Many Requests - Rate limit exceeded' },
    
    // 5xx Server Errors
    500: { category: 'SERVER_ERROR', message: 'Internal Server Error' },
    501: { category: 'SERVER_ERROR', message: 'Not Implemented' },
    502: { category: 'SERVER_ERROR', message: 'Bad Gateway - Invalid response from upstream' },
    503: { category: 'SERVER_ERROR', message: 'Service Unavailable - Server temporarily unavailable' },
    504: { category: 'SERVER_ERROR', message: 'Gateway Timeout - Upstream server timeout' },
};

/**
 * Get status code information
 * @param {number} statusCode - HTTP status code
 * @returns {object} Status code category and message
 */
function getStatusInfo(statusCode) {
    return STATUS_CODES[statusCode] || { 
        category: 'UNKNOWN', 
        message: `Unknown status code: ${statusCode}` 
    };
}

/**
 * Log request details with status code information
 * @param {string} method - HTTP method
 * @param {string} url - Request URL
 * @param {object} response - HTTP response object
 * @param {boolean} passed - Whether validations passed
 */
function logRequestDetails(method, url, response, passed) {
    const statusInfo = getStatusInfo(response.status);
    const duration = response.timings.duration.toFixed(2);
    const threshold = getThreshold(method);
    const withinThreshold = isWithinThreshold(method, response.timings.duration);
    
    const icon = passed ? '✓' : '✗';
    const statusIcon = statusInfo.category === 'SUCCESS' ? '✓' : 
                       statusInfo.category === 'CLIENT_ERROR' ? '⚠' : 
                       statusInfo.category === 'SERVER_ERROR' ? '✗' : 'ℹ';
    
    const timeIcon = withinThreshold ? '✓' : '⚠';
    
    const message = [
        `${icon} ${method} Request:`,
        `URL=${url}`,
        `${statusIcon} Status=${response.status} [${statusInfo.category}] - ${statusInfo.message}`,
        `${timeIcon} Time=${duration}ms (threshold: ${threshold}ms)`,
    ].join(' | ');
    
    if (passed && withinThreshold) {
        console.log(message);
    } else {
        console.error(message);
        if (response.body && response.body.length < 500) {
            console.error(`Response Body: ${response.body}`);
        }
    }
}

/**
 * Default parameters for HTTP requests
 */
const defaultParams = {
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: '30s',
};

/**
 * Performs a GET request
 * @param {string} url - The URL to request
 * @param {object} params - Additional request parameters (headers, timeout, etc.)
 * @param {object} validations - Custom validation checks
 * @returns {object} HTTP response object
 */
export function get(url, params = {}, validations = {}) {
    const method = 'GET';
    const requestParams = Object.assign({}, defaultParams, params);
    const response = http.get(url, requestParams);
    
    const threshold = getThreshold(method);
    
    // Default validations using dynamic threshold
    const defaultValidations = {
        'GET: status is 200': (r) => r.status === 200,
        [`GET: response time < ${threshold}ms`]: (r) => r.timings.duration < threshold,
        'GET: response has body': (r) => r.body && r.body.length > 0,
    };
    
    // Merge with custom validations
    const allValidations = Object.assign({}, defaultValidations, validations);
    
    const checkResult = check(response, allValidations);
    
    // Log detailed request information
    logRequestDetails(method, url, response, checkResult);
    
    return response;
}

/**
 * Performs a POST request
 * @param {string} url - The URL to request
 * @param {object|string} payload - The request payload
 * @param {object} params - Additional request parameters
 * @param {object} validations - Custom validation checks
 * @returns {object} HTTP response object
 */
export function post(url, payload, params = {}, validations = {}) {
    const method = 'POST';
    const requestParams = Object.assign({}, defaultParams, params);
    const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const response = http.post(url, body, requestParams);
    
    const threshold = getThreshold(method);
    
    // Default validations using dynamic threshold
    const defaultValidations = {
        'POST: status is 200 or 201': (r) => r.status === 200 || r.status === 201,
        [`POST: response time < ${threshold}ms`]: (r) => r.timings.duration < threshold,
    };
    
    const allValidations = Object.assign({}, defaultValidations, validations);
    
    const checkResult = check(response, allValidations);
    
    // Log detailed request information
    logRequestDetails(method, url, response, checkResult);
    
    return response;
}

/**
 * Performs a PUT request
 * @param {string} url - The URL to request
 * @param {object|string} payload - The request payload
 * @param {object} params - Additional request parameters
 * @param {object} validations - Custom validation checks
 * @returns {object} HTTP response object
 */
export function put(url, payload, params = {}, validations = {}) {
    const method = 'PUT';
    const requestParams = Object.assign({}, defaultParams, params);
    const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const response = http.put(url, body, requestParams);
    
    const threshold = getThreshold(method);
    
    // Default validations using dynamic threshold
    const defaultValidations = {
        'PUT: status is 200': (r) => r.status === 200,
        [`PUT: response time < ${threshold}ms`]: (r) => r.timings.duration < threshold,
    };
    
    const allValidations = Object.assign({}, defaultValidations, validations);
    
    const checkResult = check(response, allValidations);
    
    // Log detailed request information
    logRequestDetails(method, url, response, checkResult);
    
    return response;
}

/**
 * Performs a PATCH request
 * @param {string} url - The URL to request
 * @param {object|string} payload - The request payload
 * @param {object} params - Additional request parameters
 * @param {object} validations - Custom validation checks
 * @returns {object} HTTP response object
 */
export function patch(url, payload, params = {}, validations = {}) {
    const method = 'PATCH';
    const requestParams = Object.assign({}, defaultParams, params);
    const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const response = http.patch(url, body, requestParams);
    
    const threshold = getThreshold(method);
    
    // Default validations using dynamic threshold
    const defaultValidations = {
        'PATCH: status is 200': (r) => r.status === 200,
        [`PATCH: response time < ${threshold}ms`]: (r) => r.timings.duration < threshold,
    };
    
    const allValidations = Object.assign({}, defaultValidations, validations);
    
    const checkResult = check(response, allValidations);
    
    // Log detailed request information
    logRequestDetails(method, url, response, checkResult);
    
    return response;
}

/**
 * Performs a DELETE request
 * @param {string} url - The URL to request
 * @param {object} params - Additional request parameters
 * @param {object} validations - Custom validation checks
 * @returns {object} HTTP response object
 */
export function del(url, params = {}, validations = {}) {
    const method = 'DELETE';
    const requestParams = Object.assign({}, defaultParams, params);
    const response = http.del(url, null, requestParams);
    
    const threshold = getThreshold(method);
    
    // Default validations using dynamic threshold
    const defaultValidations = {
        'DELETE: status is 200 or 204': (r) => r.status === 200 || r.status === 204,
        [`DELETE: response time < ${threshold}ms`]: (r) => r.timings.duration < threshold,
    };
    
    const allValidations = Object.assign({}, defaultValidations, validations);
    
    const checkResult = check(response, allValidations);
    
    // Log detailed request information
    logRequestDetails(method, url, response, checkResult);
    
    return response;
}

/**
 * Performs a HEAD request
 * @param {string} url - The URL to request
 * @param {object} params - Additional request parameters
 * @param {object} validations - Custom validation checks
 * @returns {object} HTTP response object
 */
export function head(url, params = {}, validations = {}) {
    const method = 'HEAD';
    const requestParams = Object.assign({}, defaultParams, params);
    const response = http.head(url, requestParams);
    
    const threshold = getThreshold(method);
    
    // Default validations using dynamic threshold
    const defaultValidations = {
        'HEAD: status is 200': (r) => r.status === 200,
        [`HEAD: response time < ${threshold}ms`]: (r) => r.timings.duration < threshold,
    };
    
    const allValidations = Object.assign({}, defaultValidations, validations);
    
    const checkResult = check(response, allValidations);
    
    // Log detailed request information
    logRequestDetails(method, url, response, checkResult);
    
    return response;
}

/**
 * Performs an OPTIONS request
 * @param {string} url - The URL to request
 * @param {object} params - Additional request parameters
 * @param {object} validations - Custom validation checks
 * @returns {object} HTTP response object
 */
export function options(url, params = {}, validations = {}) {
    const method = 'OPTIONS';
    const requestParams = Object.assign({}, defaultParams, params);
    const response = http.options(url, requestParams);
    
    const threshold = getThreshold(method);
    
    // Default validations using dynamic threshold
    const defaultValidations = {
        'OPTIONS: status is 200 or 204': (r) => r.status === 200 || r.status === 204,
        [`OPTIONS: response time < ${threshold}ms`]: (r) => r.timings.duration < threshold,
    };
    
    const allValidations = Object.assign({}, defaultValidations, validations);
    
    const checkResult = check(response, allValidations);
    
    // Log detailed request information
    logRequestDetails(method, url, response, checkResult);
    
    return response;
}

/**
 * Batch multiple HTTP requests
 * @param {Array} requests - Array of request objects with {method, url, payload, params}
 * @returns {Array} Array of response objects
 */
export function batch(requests) {
    const batchRequests = requests.map(req => {
        const method = req.method.toLowerCase();
        const params = Object.assign({}, defaultParams, req.params);
        
        switch (method) {
            case 'get':
                return ['GET', req.url, null, params];
            case 'post':
                return ['POST', req.url, JSON.stringify(req.payload), params];
            case 'put':
                return ['PUT', req.url, JSON.stringify(req.payload), params];
            case 'patch':
                return ['PATCH', req.url, JSON.stringify(req.payload), params];
            case 'delete':
                return ['DELETE', req.url, null, params];
            default:
                return ['GET', req.url, null, params];
        }
    });
    
    return http.batch(batchRequests);
}
