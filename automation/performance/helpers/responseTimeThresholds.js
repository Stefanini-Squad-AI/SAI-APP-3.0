/**
 * Response Time Thresholds Configuration
 * 
 * Defines maximum acceptable response times for different HTTP methods.
 * These thresholds are used to determine if an API request is performing
 * within acceptable parameters.
 * 
 * Thresholds are based on industry best practices:
 * - GET: Fast read operations (1 second)
 * - POST: Create operations with validation (2 seconds)
 * - PUT: Full resource updates (2 seconds)
 * - PATCH: Partial resource updates (1.5 seconds)
 * - DELETE: Remove operations (1.5 seconds)
 * - HEAD: Metadata retrieval (500ms)
 * - OPTIONS: CORS/capability checks (500ms)
 * 
 * You can adjust these values based on your specific API requirements.
 */

export const RESPONSE_TIME_THRESHOLDS = {
    /**
     * GET requests - Read operations
     * Expected to be fast as they only retrieve data without modifications
     */
    GET: 1000, // 1 second
    
    /**
     * POST requests - Create operations
     * May involve validation, database writes, and business logic
     */
    POST: 2000, // 2 seconds
    
    /**
     * PUT requests - Full update operations
     * Replace entire resource, may involve multiple validations
     */
    PUT: 2000, // 2 seconds
    
    /**
     * PATCH requests - Partial update operations
     * Update specific fields, typically faster than PUT
     */
    PATCH: 1500, // 1.5 seconds
    
    /**
     * DELETE requests - Remove operations
     * May involve cascade deletions or cleanup operations
     */
    DELETE: 1500, // 1.5 seconds
    
    /**
     * HEAD requests - Metadata retrieval
     * Only returns headers, no body, should be very fast
     */
    HEAD: 500, // 0.5 seconds
    
    /**
     * OPTIONS requests - CORS preflight and capability checks
     * Lightweight operation, should be very fast
     */
    OPTIONS: 500, // 0.5 seconds
};

/**
 * Get response time threshold for a specific HTTP method
 * 
 * @param {string} method - HTTP method (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS)
 * @returns {number} Maximum acceptable response time in milliseconds
 */
export function getThreshold(method) {
    const methodUpper = method.toUpperCase();
    return RESPONSE_TIME_THRESHOLDS[methodUpper] || 2000; // Default to 2 seconds if method not found
}

/**
 * Check if response time is within acceptable threshold
 * 
 * @param {string} method - HTTP method
 * @param {number} duration - Actual response time in milliseconds
 * @returns {boolean} True if within threshold, false otherwise
 */
export function isWithinThreshold(method, duration) {
    const threshold = getThreshold(method);
    return duration <= threshold;
}

/**
 * Get human-readable threshold description
 * 
 * @param {string} method - HTTP method
 * @returns {string} Formatted threshold description
 */
export function getThresholdDescription(method) {
    const threshold = getThreshold(method);
    if (threshold >= 1000) {
        return `${threshold / 1000} second${threshold > 1000 ? 's' : ''}`;
    }
    return `${threshold}ms`;
}

/**
 * Get all thresholds as formatted object for reporting
 * 
 * @returns {object} Object with method names and their thresholds
 */
export function getAllThresholds() {
    return Object.assign({}, RESPONSE_TIME_THRESHOLDS);
}
