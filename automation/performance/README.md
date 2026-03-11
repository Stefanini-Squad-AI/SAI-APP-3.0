# 🚀 K6 Performance Testing Framework

Automated framework for performance, load, and stress testing of APIs using K6.

## 📋 Quick Start

### Prerequisites
- [K6](https://k6.io/docs/get-started/installation/) installed
- Git
- Dev Container (optional, recommended)

### Installation
```bash
git clone <repository-url>
cd k6-performance-framework
```

### Run Your First Test
```bash
# Linux/Mac
./run_test.sh demo_ticketlog PERFORMANCE TRADITIONAL

# Windows
run_test.bat demo_ticketlog PERFORMANCE TRADITIONAL
```

### View Results
Reports are generated in: `reports/YYYY-MM-DD/<test_name>_v1/test-<test_name>.html`

---

## 📖 Usage

### Command Syntax

```bash
# Linux/Mac
./run_test.sh <TEST_NAME> <TEST_TYPE> <REPORT_MODE>

# Windows
run_test.bat <TEST_NAME> <TEST_TYPE> <REPORT_MODE>
```

### Parameters

| Parameter | Options | Description |
|-----------|---------|-------------|
| `TEST_NAME` | Any string | Test name (e.g., demo_ticketlog, my_api) |
| `TEST_TYPE` | PERFORMANCE, LOAD, STRESS | Type of test to run |
| `REPORT_MODE` | TRADITIONAL, REALTIME | Report generation mode |

---

## 🎯 Test Types

### PERFORMANCE
- **Purpose**: Evaluates system behavior under normal conditions
- **VUs**: 1 virtual user
- **Iterations**: 1 iteration per user
- **Use case**: Smoke testing, quick validation, CI/CD pipelines, single request verification
- **Thresholds**: 95% of requests < 3000ms, < 1% failures

### LOAD
- **Purpose**: Evaluates system behavior under high load
- **VUs**: 10 virtual users
- **Iterations**: 30 iterations per user (total: 300 iterations)
- **Use case**: Pre-production testing, scalability validation, concurrent user simulation
- **Thresholds**: 95% of requests < 5000ms, < 5% failures

### STRESS
- **Purpose**: Determines maximum system capacity
- **Type**: Ramping arrival rate
- **Stages**: Increase from 10 → 300 req/s
- **Max VUs**: 500
- **Duration**: ~13 minutes
- **Use case**: Capacity planning, infrastructure sizing
- **Thresholds**: 95% of requests < 8000ms, < 10% failures

---

## 📊 Report Modes

### TRADITIONAL
- Generates custom HTML report with professional design
- Executive summary with key metrics
- Detailed performance analysis
- Percentiles (p50, p90, p95, p99)
- Validation checks analysis
- Responsive design

### REALTIME
- Uses K6 Web Dashboard
- Real-time visualization during execution
- Automatic HTML export on completion
- Ideal for long tests or live monitoring
- Accessible at http://127.0.0.1:5665 during execution

---

## 📝 Examples

### Example 1: Quick Performance Test
```bash
./run_test.sh demo_ticketlog PERFORMANCE TRADITIONAL
```
**Result**: Single iteration test (1 VU, 1 iteration) with custom HTML report

### Example 2: Load Test with Real-time Dashboard
```bash
./run_test.sh demo_ticketlog2 LOAD REALTIME
```
**Result**: Load test with 10 VUs executing 30 iterations each (300 total) with live dashboard

### Example 3: Stress Test
```bash
./run_test.sh demo_ticketlog3 STRESS TRADITIONAL
```
**Result**: ~13-minute ramping arrival rate capacity test with detailed report

### Example 4: Public API Test (New!)
```bash
./run_test.sh api-objects PERFORMANCE TRADITIONAL
```
**Result**: Test against public REST API (https://api.restful-api.dev/objects)

### Example 5: GitHub Zen API Test (New!)
```bash
./run_test.sh github-zen PERFORMANCE TRADITIONAL
```
**Result**: Test GitHub Zen quote API (https://github-api.mock.beeceptor.com/zen)

---

## 🛠️ Creating Custom Tests

### 1. Copy the Template
```bash
# Linux/Mac
cp scripts/template-test.js scripts/test-my_api.js

# Windows
copy scripts\template-test.js scripts\test-my_api.js
```

### 2. Edit Configuration
```javascript
// Change base URL and endpoint
const baseUrl = 'https://your-api.com';
const endpoint = '/your/endpoint';
```

### 3. Customize Using Helpers
The framework provides HTTP method helpers in `helpers/httpMethods.js`:

```javascript
import { get, post, put, patch, del } from '../helpers/httpMethods.js';

export default function () {
    // GET request with custom validations
    get(`${baseUrl}/users`, {}, {
        'status is 200': (r) => r.status === 200,
        'response time < 2000ms': (r) => r.timings.duration < 2000,
    });

    // POST request with payload
    post(`${baseUrl}/users`, {
        name: 'John Doe',
        email: 'john@example.com'
    }, {}, {
        'status is 201': (r) => r.status === 201,
    });

    // PUT request
    put(`${baseUrl}/users/1`, {
        name: 'Jane Doe'
    }, {}, {
        'status is 200': (r) => r.status === 200,
    });

    // PATCH request
    patch(`${baseUrl}/users/1`, {
        email: 'jane@example.com'
    });

    // DELETE request
    del(`${baseUrl}/users/1`);
}
```

### 4. Run Your Test
```bash
./run_test.sh my_api PERFORMANCE TRADITIONAL
```

---

## 📁 Project Structure

```
k6-performance-framework/
├── config/                      # Framework configuration
│   ├── test-types.js           # Test type definitions (PERFORMANCE, LOAD, STRESS)
│   └── report-generator.js     # Custom HTML report generator
├── helpers/                     # Utility functions
│   ├── httpMethods.js          # HTTP request helpers (GET, POST, PUT, PATCH, DELETE)
│   └── responseTimeThresholds.js # Response time thresholds by HTTP method
├── scripts/                     # Test scripts
│   ├── test-api-objects.js     # Example: Public API test (NEW!)
│   ├── test-github-zen.js      # Example: GitHub Zen API test (NEW!)
│   ├── test-demo_ticketlog.js  # Example test 1
│   ├── test-demo_ticketlog2.js # Example test 2
│   ├── test-demo_ticketlog3.js # Example test 3
│   └── template-test.js        # Template for new tests
├── jsons/                      # JSON results (organized by test/date/version)
│   └── <test_name>/
│       └── <YYYY-MM-DD>/
│           └── v1/, v2/, ...
├── reports/                    # HTML reports (organized by date/test/version)
│   └── <YYYY-MM-DD>/
│       └── <test_name>_v1/
│           └── test-<test_name>.html
├── run_test.sh                 # Execution script (Linux/Mac)
├── run_test.bat                # Execution script (Windows)
└── README.md                   # This file
```

---

## 🔧 HTTP Methods Helper

The `helpers/httpMethods.js` module provides simplified HTTP request methods with enhanced features:

### Available Methods
- `get(url, params, validations)` - GET requests
- `post(url, payload, params, validations)` - POST requests
- `put(url, payload, params, validations)` - PUT requests
- `patch(url, payload, params, validations)` - PATCH requests
- `del(url, params, validations)` - DELETE requests
- `head(url, params, validations)` - HEAD requests
- `options(url, params, validations)` - OPTIONS requests
- `batch(requests)` - Batch multiple requests

### Features
- **Automatic JSON stringification** for request payloads
- **Built-in error handling and logging** with detailed information
- **Default validations** (customizable per request)
- **Dynamic response time thresholds** based on HTTP method
- **Comprehensive status code reporting** (200, 201, 400, 404, 500, etc.)
- **Color-coded console output** with status categories
- **Consistent timeout handling** (30s default)

### Enhanced Status Code Reporting

All HTTP requests now provide detailed status information:

#### Success (2xx)
- ✓ 200: OK - Request successful
- ✓ 201: Created - Resource created successfully
- ✓ 202: Accepted - Request accepted for processing
- ✓ 204: No Content - Request successful, no content to return

#### Client Errors (4xx)
- ⚠ 400: Bad Request - Invalid request syntax
- ⚠ 401: Unauthorized - Authentication required
- ⚠ 403: Forbidden - Access denied
- ⚠ 404: Not Found - Resource does not exist
- ⚠ 405: Method Not Allowed
- ⚠ 408: Request Timeout
- ⚠ 409: Conflict - Request conflicts with current state
- ⚠ 422: Unprocessable Entity - Validation failed
- ⚠ 429: Too Many Requests - Rate limit exceeded

#### Server Errors (5xx)
- ✗ 500: Internal Server Error
- ✗ 501: Not Implemented
- ✗ 502: Bad Gateway - Invalid response from upstream
- ✗ 503: Service Unavailable - Server temporarily unavailable
- ✗ 504: Gateway Timeout - Upstream server timeout

### Console Output Example

```
✓ GET Request: | URL=https://api.example.com/users | ✓ Status=200 [SUCCESS] - OK | ✓ Time=245ms (threshold: 1000ms)
✗ POST Request: | URL=https://api.example.com/users | ⚠ Status=400 [CLIENT_ERROR] - Bad Request | ⚠ Time=1850ms (threshold: 2000ms)
```

---

## 📂 Report Organization

Reports are automatically organized by date and version:

```
reports/
└── 2025-12-18/
    ├── demo_ticketlog_v1/
    │   └── test-demo_ticketlog.html
    ├── demo_ticketlog_v2/
    │   └── test-demo_ticketlog.html
    └── my_api_v1/
        └── test-my_api.html
```

**Benefits:**
- Easy comparison between multiple runs
- Historical tracking by date
- Automatic version increment for same-day runs

---

## ⏱️ Response Time Thresholds

The `helpers/responseTimeThresholds.js` module defines maximum acceptable response times for each HTTP method. These thresholds are automatically used in validations and can be customized.

### Default Thresholds

| HTTP Method | Threshold | Reason |
|-------------|-----------|--------|
| GET | 1000ms (1s) | Fast read operations |
| POST | 2000ms (2s) | Create operations with validation |
| PUT | 2000ms (2s) | Full resource updates |
| PATCH | 1500ms (1.5s) | Partial resource updates |
| DELETE | 1500ms (1.5s) | Remove operations |
| HEAD | 500ms (0.5s) | Metadata retrieval (no body) |
| OPTIONS | 500ms (0.5s) | CORS preflight checks |

### Customizing Thresholds

Edit `helpers/responseTimeThresholds.js`:

```javascript
export const RESPONSE_TIME_THRESHOLDS = {
    GET: 800,     // Change to 800ms
    POST: 1500,   // Change to 1.5s
    PUT: 1500,    // Change to 1.5s
    PATCH: 1200,  // Change to 1.2s
    DELETE: 1000, // Change to 1s
    HEAD: 300,    // Change to 300ms
    OPTIONS: 300, // Change to 300ms
};
```

### Using Thresholds in Tests

Thresholds are automatically applied to all HTTP requests:

```javascript
import { get } from '../helpers/httpMethods.js';

// Automatic validation using GET threshold (1000ms)
get('https://api.example.com/users');

// Override with custom validation
get('https://api.example.com/users', {}, {
    'custom response time': (r) => r.timings.duration < 500, // Stricter: 500ms
});
```

---

## ⚙️ Test Configuration Details

### Configuration Modes

The framework uses two different execution models:

#### Iteration-Based (PERFORMANCE & LOAD)
- **PERFORMANCE**: 1 VU × 1 iteration = 1 total execution
- **LOAD**: 10 VUs × 30 iterations = 300 total executions
- Best for: Consistent load, specific iteration counts, predictable test duration

#### Ramping Arrival Rate (STRESS)
- Gradually increases requests per second
- Dynamic VU allocation based on demand
- Best for: Finding system limits, capacity planning

### Custom Test Types

You can add custom test types by editing `config/test-types.js`:

```javascript
export const TEST_TYPES = {
    CUSTOM: {
        name: 'CUSTOM',
        description: 'My custom test',
        options: {
            vus: 20,
            iterations: 50, // 20 VUs × 50 iterations = 1000 total
            thresholds: {
                http_req_duration: ['p(95)<2000'],
                http_req_failed: ['rate<0.02'],
            },
        }
    }
};
```

---

## 📊 Included Metrics

### Traditional Reports Include:
- **Success Rate**: Percentage of successful validations
- **HTTP Requests**: Total count and rate per second
- **Iterations**: Total count and rate
- **Virtual Users**: Average and maximum
- **Request Duration**: Min, Max, Avg, Percentiles (p50, p90, p95, p99)
- **Waiting Time**: Server processing time
- **Connection Time**: TCP and TLS handshake

---

## 🎨 Customizing Reports

Edit `config/report-generator.js` to customize:
- HTML/CSS styling
- Displayed metrics
- Visual design
- Color schemes
- Layout structure

### Test Run IDs

Every test execution generates a unique Test Run ID for easy tracking and correlation:

**Format**: `TEST-{TYPE}-{RANDOM}`
- `TYPE`: Test type (PERFORMANCE, LOAD, STRESS)
- `RANDOM`: 8-character alphanumeric string

**Example**: `TEST-PERFORMANCE-A7X9K2M5`

**Benefits**:
- Unique identification for each test run
- Easy correlation between JSON results and HTML reports
- Simplified debugging and analysis
- Historical tracking and comparison

The Test Run ID appears in:
- HTML report header
- Console output
- Test summary logs

### Intelligent Validation Descriptions

All validation checks in HTML reports include automatic natural language descriptions:

**Pattern Matching Examples**:
- `status is 200` → "Validates that the HTTP response status code is 200 (OK), indicating a successful request"
- `response time < 1000` → "Validates that the response time is less than 1000 milliseconds, ensuring acceptable performance"
- `response is array` → "Validates that the response body is an array, confirming expected data structure"
- `has id field` → "Validates that each response object contains an 'id' field, confirming data integrity"

**Features**:
- Technical and natural language explanations
- Context-aware descriptions based on check names
- Helps non-technical stakeholders understand test results
- Automatic generation without manual configuration

### Enhanced Percentile Charts

HTML reports display accurate percentile data with intelligent detection:

**Displayed Metrics**:
- **Median (p50)**: Uses K6's `med` metric for accurate median values
- **p90**: 90th percentile response time
- **p95**: 95th percentile response time
- **Max**: Maximum response time observed

**Visual Features**:
- CSS-only bar charts (no external libraries)
- Color-coded bars for easy interpretation
- Percentage width relative to maximum value
- Actual values displayed on each bar

**Note**: K6 doesn't generate p99 by default in standard configurations, so the chart focuses on the most commonly used percentiles.

---

## 🐛 Troubleshooting

### K6 Not Found
```bash
# macOS
brew install k6

# Windows
choco install k6

# Linux (Debian/Ubuntu)
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
  --keyserver hkp://keyserver.ubuntu.com:80 \
  --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | \
  sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

### Permission Denied (Linux/Mac)
```bash
chmod +x run_test.sh
```

### Port 5665 Already in Use (REALTIME mode)
```bash
# Linux/Mac
lsof -i :5665
kill -9 <PID>

# Windows
netstat -ano | findstr :5665
taskkill /PID <PID> /F
```

### Understanding Status Codes in Test Results

When tests fail, check the console output for detailed status information:

```
✗ POST Request: | URL=https://api.example.com/users | ⚠ Status=401 [CLIENT_ERROR] - Unauthorized
```

**Troubleshooting by Status Code:**

- **401 Unauthorized**: Check authentication headers, API keys, or tokens
- **403 Forbidden**: Verify user permissions and access rights
- **404 Not Found**: Confirm endpoint URL and resource existence
- **429 Too Many Requests**: Reduce test load or implement rate limiting
- **500 Internal Server Error**: Server-side issue, contact API team
- **502/504 Gateway errors**: Network/proxy issues or upstream timeout

### Response Time Threshold Failures

If requests fail threshold validations:

```
⚠ Time=1245ms (threshold: 1000ms)
```

**Solutions:**
1. Adjust thresholds in `helpers/responseTimeThresholds.js` if expectations are unrealistic
2. Optimize API performance if thresholds are reasonable
3. Check network conditions and latency
4. Review server resources and scaling

---

## 🤖 CI/CD Integration

### GitHub Actions Pipeline

The framework includes a GitHub Actions workflow that automatically runs performance tests on every push to the `main` branch.

**Workflow File**: `.github/workflows/k6-tests.yml`

**What It Does**:
1. ✅ Installs K6 on Ubuntu runner
2. 🧪 Runs PERFORMANCE tests for:
   - `test-api-objects.js` (1 VU, 1 iteration)
   - `test-github-zen.js` (1 VU, 1 iteration)
3. 📊 Generates HTML reports and JSON results
4. 📦 Uploads artifacts (reports and results)
5. 📝 Creates test execution summary

**Artifacts Retention**: 30 days

**Viewing Reports**:
1. Go to **Actions** tab in GitHub
2. Click on the latest workflow run
3. Scroll to **Artifacts** section
4. Download `k6-html-reports` or `k6-json-results`
5. Extract and open HTML files in browser

**Customizing the Pipeline**:

Edit `.github/workflows/k6-tests.yml` to:
- Change test types (PERFORMANCE → LOAD or STRESS)
- Add more tests
- Modify retention days
- Change trigger branches
- Add Slack/email notifications

**Example Modifications**:

```yaml
# Run on multiple branches
on:
  push:
    branches:
      - main
      - develop
      - staging

# Run LOAD tests instead
- name: Run test-api-objects (LOAD)
  run: ./run_test.sh api-objects LOAD TRADITIONAL

# Add more tests
- name: Run test-custom-api (PERFORMANCE)
  run: ./run_test.sh custom-api PERFORMANCE TRADITIONAL
```

**Local Testing Before Push**:
```bash
# Test what the pipeline will execute
./run_test.sh api-objects PERFORMANCE TRADITIONAL
./run_test.sh github-zen PERFORMANCE TRADITIONAL
```

---

## 🔗 Useful Commands

### Run Multiple Tests
```bash
# Sequential execution
./run_test.sh test1 PERFORMANCE TRADITIONAL
./run_test.sh test2 LOAD TRADITIONAL
./run_test.sh test3 STRESS REALTIME
```

### Using Environment Variables
```bash
# Custom base URL
BASE_URL=https://staging.api.com ./run_test.sh my_test PERFORMANCE TRADITIONAL

# Multiple variables
BASE_URL=https://prod.api.com VUS=50 ./run_test.sh my_test LOAD REALTIME
```

---

## 📖 Additional Resources

- [K6 Official Documentation](https://k6.io/docs/)
- [K6 Examples](https://k6.io/docs/examples/)
- [K6 JavaScript API](https://k6.io/docs/javascript-api/)

---

## 💡 Best Practices

1. **Use meaningful test names**: `test-user-login.js`, `test-checkout-flow.js`
2. **Add sleep() between requests**: Simulate real user behavior
3. **Define clear thresholds**: Set realistic performance goals in `responseTimeThresholds.js`
4. **Use helpers for consistency**: Leverage `httpMethods.js` for all HTTP requests
5. **Validate responses**: Always check status codes and content
6. **Monitor status codes**: Use enhanced logging to identify issues quickly
7. **Adjust thresholds**: Customize response time expectations per method
8. **Document your tests**: Add comments explaining test logic
9. **Version control**: Track test changes over time
10. **Regular execution**: Run tests periodically to catch regressions
11. **Analyze failures**: Review status code categories (SUCCESS, CLIENT_ERROR, SERVER_ERROR)
12. **Example-driven development**: Use `test-api-objects.js` as reference for new tests

---

## 🤝 Contributing

To contribute to this framework:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🆕 Recent Updates

### Version 2.1 - Advanced Reporting & CI/CD Integration

**New Features:**
- 🎯 **Unique Test Run IDs**: Each test execution gets a unique identifier (TEST-{TYPE}-{8RANDOM}) for easy tracking
- 📝 **Intelligent Validation Descriptions**: Automatic natural language descriptions for all validation checks in reports
- 📊 **Enhanced HTML Reports**: Improved percentile charts (p50, p90, p95, Max) with accurate median detection
- 🕒 **Formatted Timestamps**: Human-readable date/time format in reports (Month DD, YYYY at HH:MM:SS AM/PM)
- 🚀 **New Example Tests**: 
  - `test-api-objects.js` - Public REST API example with 8 validation checks
  - `test-github-zen.js` - GitHub Zen API example with 4 validation checks
- 🔄 **GitHub Actions Integration**: Automated CI/CD pipeline for continuous testing

**What's Changed:**
- `config/report-generator.js`: Added `generateTestRunId()` and `formatDateTime()` functions, fixed percentile chart detection
- `scripts/test-api-objects.js`: Complete example testing https://api.restful-api.dev/objects
- `scripts/test-github-zen.js`: NEW example testing GitHub Zen quote API
- `.github/workflows/k6-tests.yml`: NEW CI/CD pipeline configuration
- `README.md`: Updated documentation with new features and examples

### Version 2.0 - Enhanced Status Reporting & Response Time Management

**New Features:**
- ✨ **Response Time Thresholds**: Configurable maximum response times per HTTP method
- 🎯 **Enhanced Status Code Reporting**: Comprehensive status code tracking and categorization
- 📊 **Detailed Console Logging**: Color-coded output with status categories and threshold validation
- 🔧 **Dynamic Validations**: Automatic threshold-based validations for all HTTP methods

**What's Changed:**
- `helpers/httpMethods.js`: Updated with status code handling and threshold integration
- `helpers/responseTimeThresholds.js`: New helper for configurable response time expectations

---

**Built with ❤️ for effective performance testing**
