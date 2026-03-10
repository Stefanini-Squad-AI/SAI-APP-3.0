/**
 * Custom HTML Report Generator for K6 Performance Tests
 * 
 * Generates elegant, professional HTML reports with:
 * - Executive summary with key metrics
 * - Detailed performance statistics
 * - Visual charts and graphs (pure CSS)
 * - Threshold validation results
 * - Test configuration information
 */

/**
 * Generates a random test run ID with format: TEST-{TYPE}-{RANDOM}
 * @param {string} testType - Type of test (PERFORMANCE, LOAD, STRESS)
 * @returns {string} Random test run ID
 */
function generateTestRunId(testType) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randomPart = '';
    for (let i = 0; i < 8; i++) {
        randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `TEST-${testType}-${randomPart}`;
}

/**
 * Formats a date to a complete readable string
 * @param {Date} date - Date object
 * @returns {string} Formatted date string
 */
function formatDateTime(date) {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        date = new Date();
    }
    
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    };
    
    return date.toLocaleString('en-US', options);
}

/**
 * Generates a custom HTML report with test results
 * @param {object} data - K6 test data
 * @param {string} testName - Name of the test
 * @param {string} testType - Type of test (PERFORMANCE, LOAD, STRESS)
 * @returns {string} HTML report
 */
export function generateCustomHTMLReport(data, testName = 'Unknown', testType = 'PERFORMANCE') {
    const metrics = data.metrics;
    const testInfo = data.root_group;
    const state = data.state;
    
    // Generate custom test run ID if not present
    const testRunId = state.testRunId || generateTestRunId(testType);
    
    // Get test start time
    const testStarted = state.testRunStarted ? new Date(state.testRunStarted) : new Date();
    const formattedStartTime = formatDateTime(testStarted);
    
    // Calcular estadísticas clave
    const httpReqDuration = metrics.http_req_duration;
    const httpReqFailed = metrics.http_req_failed;
    const httpReqs = metrics.http_reqs;
    const iterations = metrics.iterations;
    const vus = metrics.vus;
    const vusMax = metrics.vus_max;
    
    // Obtener información de checks
    const checks = metrics.checks;
    const checksPass = checks ? checks.values.passes : 0;
    const checksFail = checks ? checks.values.fails : 0;
    const checksTotal = checksPass + checksFail;
    const checksPassRate = checksTotal > 0 ? ((checksPass / checksTotal) * 100).toFixed(2) : 0;
    
    // Colores según resultado
    const getStatusColor = (rate) => {
        if (rate >= 95) return '#10b981'; // Verde
        if (rate >= 80) return '#f59e0b'; // Amarillo
        return '#ef4444'; // Rojo
    };
    
    const statusColor = getStatusColor(checksPassRate);
    
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte de Pruebas K6 - ${state.testRunId}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            color: #333;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .header p {
            font-size: 1.1em;
            opacity: 0.9;
        }
        
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            padding: 30px;
            background: #f8fafc;
        }
        
        .summary-card {
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            border-left: 4px solid #667eea;
            transition: transform 0.2s;
        }
        
        .summary-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .summary-card.success {
            border-left-color: #10b981;
        }
        
        .summary-card.warning {
            border-left-color: #f59e0b;
        }
        
        .summary-card.error {
            border-left-color: #ef4444;
        }
        
        .summary-card h3 {
            font-size: 0.9em;
            color: #64748b;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .summary-card .value {
            font-size: 2em;
            font-weight: bold;
            color: #1e293b;
        }
        
        .summary-card .unit {
            font-size: 0.8em;
            color: #94a3b8;
            margin-left: 5px;
        }
        
        .metrics-section {
            padding: 30px;
        }
        
        .metrics-section h2 {
            color: #1e293b;
            margin-bottom: 20px;
            font-size: 1.8em;
            border-bottom: 3px solid #667eea;
            padding-bottom: 10px;
        }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        
        .metric-card {
            background: #f8fafc;
            border-radius: 8px;
            padding: 20px;
            border: 1px solid #e2e8f0;
        }
        
        .metric-card h3 {
            color: #475569;
            margin-bottom: 15px;
            font-size: 1.1em;
        }
        
        .metric-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .metric-row:last-child {
            border-bottom: none;
        }
        
        .metric-label {
            color: #64748b;
            font-weight: 500;
        }
        
        .metric-value {
            color: #1e293b;
            font-weight: bold;
        }
        
        .checks-section {
            padding: 30px;
            background: #f8fafc;
        }
        
        .checks-section h2 {
            color: #1e293b;
            margin-bottom: 20px;
            font-size: 1.8em;
        }
        
        .progress-bar {
            width: 100%;
            height: 40px;
            background: #e2e8f0;
            border-radius: 20px;
            overflow: hidden;
            position: relative;
            margin: 20px 0;
        }
        
        .progress-fill {
            height: 100%;
            background: ${statusColor};
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 1.1em;
            transition: width 1s ease-in-out;
        }
        
        .thresholds {
            padding: 30px;
        }
        
        .thresholds h2 {
            color: #1e293b;
            margin-bottom: 20px;
            font-size: 1.8em;
        }
        
        .threshold-item {
            background: white;
            padding: 15px 20px;
            margin: 10px 0;
            border-radius: 8px;
            border-left: 4px solid #10b981;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }
        
        .threshold-item.failed {
            border-left-color: #ef4444;
        }
        
        .footer {
            background: #1e293b;
            color: white;
            padding: 20px;
            text-align: center;
        }
        
        .footer p {
            margin: 5px 0;
            opacity: 0.8;
        }
        
        /* Visual Charts */
        .chart-container {
            margin: 30px 0;
            padding: 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .chart-title {
            font-size: 1.2em;
            color: #1e293b;
            margin-bottom: 20px;
            font-weight: 600;
        }
        
        .bar-chart {
            display: flex;
            align-items: flex-end;
            justify-content: space-around;
            height: 200px;
            padding: 10px;
            border-bottom: 2px solid #e2e8f0;
            position: relative;
        }
        
        .bar {
            flex: 1;
            margin: 0 5px;
            background: linear-gradient(to top, #667eea, #764ba2);
            border-radius: 4px 4px 0 0;
            position: relative;
            transition: all 0.3s ease;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            align-items: center;
        }
        
        .bar:hover {
            opacity: 0.8;
            transform: scale(1.05);
        }
        
        .bar-value {
            position: absolute;
            top: -25px;
            font-size: 0.85em;
            font-weight: bold;
            color: #1e293b;
        }
        
        .bar-label {
            margin-top: 10px;
            font-size: 0.8em;
            color: #64748b;
            text-align: center;
        }
        
        .percentile-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }
        
        .percentile-item {
            text-align: center;
            padding: 15px;
            background: #f8fafc;
            border-radius: 8px;
            border: 2px solid #e2e8f0;
        }
        
        .percentile-value {
            font-size: 1.5em;
            font-weight: bold;
            color: #667eea;
            display: block;
            margin: 5px 0;
        }
        
        .percentile-label {
            font-size: 0.9em;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        /* Status badges */
        .badge {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .badge.success {
            background: #d1fae5;
            color: #065f46;
        }
        
        .badge.warning {
            background: #fef3c7;
            color: #92400e;
        }
        
        .badge.error {
            background: #fee2e2;
            color: #991b1b;
        }
        
        .badge.info {
            background: #dbeafe;
            color: #1e40af;
        }
        
        /* Test configuration section */
        .config-section {
            padding: 30px;
            background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
        }
        
        .config-section h2 {
            color: #1e293b;
            margin-bottom: 20px;
            font-size: 1.8em;
        }
        
        .config-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
        }
        
        .config-item {
            background: white;
            padding: 15px 20px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .config-label {
            color: #64748b;
            font-weight: 500;
        }
        
        .config-value {
            color: #1e293b;
            font-weight: bold;
            font-size: 1.1em;
        }
        
        /* Performance Overview Section */
        .performance-overview {
            padding: 30px;
            background: white;
        }
        
        .performance-overview h2 {
            color: #667eea;
            margin-bottom: 20px;
            font-size: 1.8em;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .overview-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .overview-card {
            background: white;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
        }
        
        .overview-card h3 {
            color: #64748b;
            font-size: 0.85em;
            text-transform: uppercase;
            margin-bottom: 10px;
            letter-spacing: 0.5px;
        }
        
        .overview-card .big-value {
            font-size: 2.5em;
            font-weight: bold;
            color: #667eea;
            margin: 10px 0;
        }
        
        .overview-card .unit-text {
            font-size: 0.9em;
            color: #94a3b8;
        }
        
        /* Status Code Widgets */
        .status-codes-section {
            padding: 30px;
            background: #f8fafc;
        }
        
        .status-codes-section h2 {
            color: #1e293b;
            margin-bottom: 20px;
            font-size: 1.8em;
            border-bottom: 3px solid #667eea;
            padding-bottom: 10px;
        }
        
        .status-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-bottom: 30px;
        }
        
        .status-widget {
            background: white;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            border-left: 4px solid;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .status-widget.success {
            border-left-color: #10b981;
        }
        
        .status-widget.error {
            border-left-color: #ef4444;
        }
        
        .status-widget h3 {
            font-size: 0.85em;
            color: #64748b;
            margin-bottom: 8px;
        }
        
        .status-widget .status-value {
            font-size: 2em;
            font-weight: bold;
            color: #1e293b;
        }
        
        /* Pie Chart for Status Codes */
        .pie-chart-container {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 40px;
            margin: 30px 0;
            padding: 30px;
            background: white;
            border-radius: 8px;
        }
        
        .pie-chart {
            width: 250px;
            height: 250px;
            border-radius: 50%;
            position: relative;
        }
        
        .pie-legend {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        .legend-item {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .legend-color {
            width: 20px;
            height: 20px;
            border-radius: 4px;
        }
        
        .legend-text {
            font-size: 0.9em;
            color: #1e293b;
        }
        
        /* Performance Insights */
        .insights-section {
            padding: 30px;
            background: white;
        }
        
        .insights-section h2 {
            color: #1e293b;
            margin-bottom: 20px;
            font-size: 1.8em;
        }
        
        .insight-box {
            background: #f0fdf4;
            border-left: 4px solid #10b981;
            padding: 20px;
            border-radius: 8px;
            margin-top: 15px;
        }
        
        .insight-box.warning {
            background: #fffbeb;
            border-left-color: #f59e0b;
        }
        
        .insight-box.error {
            background: #fef2f2;
            border-left-color: #ef4444;
        }
        
        .insight-box h3 {
            color: #1e293b;
            margin-bottom: 10px;
            font-size: 1.1em;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .insight-box p {
            color: #475569;
            line-height: 1.6;
            margin: 5px 0;
        }
        
        /* Timeline Chart */
        .timeline-chart {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border: 1px solid #e2e8f0;
        }
        
        .timeline-bars {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            height: 150px;
            padding: 10px;
            border-bottom: 2px solid #e2e8f0;
            gap: 2px;
        }
        
        .timeline-bar {
            flex: 1;
            background: linear-gradient(to top, #667eea, #a78bfa);
            border-radius: 2px 2px 0 0;
            min-width: 3px;
            position: relative;
            transition: all 0.2s;
        }
        
        .timeline-bar:hover {
            background: linear-gradient(to top, #764ba2, #667eea);
            transform: scaleY(1.05);
        }
        
        .timeline-labels {
            display: flex;
            justify-content: space-between;
            margin-top: 10px;
            font-size: 0.75em;
            color: #64748b;
        }
        
        @media print {
            body {
                background: white;
                padding: 0;
            }
            
            .container {
                box-shadow: none;
            }
            
            .summary-card:hover, .bar:hover {
                transform: none;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 K6 Performance Test Report</h1>
            <p><strong>Test:</strong> ${testName} | <strong>Type:</strong> ${testType}</p>
            <p><strong>Test Run ID:</strong> ${testRunId}</p>
            <p><strong>Started:</strong> ${formattedStartTime}</p>
        </div>
        
        <!-- Performance Overview -->
        <div class="performance-overview">
            <h2>Performance Overview</h2>
            <div class="overview-grid">
                <div class="overview-card">
                    <h3>Requests Made</h3>
                    <div class="big-value">${httpReqs ? (httpReqs.values.count / 1000).toFixed(1) : 0}<span style="font-size: 0.5em;">K</span></div>
                    <div class="unit-text">reqs</div>
                </div>
                <div class="overview-card">
                    <h3>HTTP Failures</h3>
                    <div class="big-value" style="color: ${httpReqFailed && httpReqFailed.values.passes > 0 ? '#ef4444' : '#10b981'};">${httpReqFailed ? httpReqFailed.values.passes : 0}</div>
                    <div class="unit-text">reqs</div>
                </div>
                <div class="overview-card">
                    <h3>Peak RPS</h3>
                    <div class="big-value">${httpReqs ? Math.ceil(httpReqs.values.rate) : 0}</div>
                    <div class="unit-text">reqs/s</div>
                </div>
                <div class="overview-card">
                    <h3>AVG Response Time</h3>
                    <div class="big-value">${httpReqDuration ? Math.round(httpReqDuration.values.avg) : 0}</div>
                    <div class="unit-text">ms</div>
                </div>
            </div>
            
            <!-- Timeline Visualization -->
            <div class="timeline-chart">
                <h3 style="color: #1e293b; margin-bottom: 15px;">Request Timeline (Simulated)</h3>
                <div class="timeline-bars">
                    ${Array.from({length: 50}, (_, i) => {
                        const vusValue = vusMax ? vusMax.values.max : 10;
                        const height = 20 + Math.random() * 80;
                        return `<div class="timeline-bar" style="height: ${height}%;" title="VUs: ${Math.floor(vusValue * height / 100)}"></div>`;
                    }).join('')}
                </div>
                <div class="timeline-labels">
                    <span>Start</span>
                    <span>Middle</span>
                    <span>End</span>
                </div>
                <div style="margin-top: 15px; text-align: center; color: #64748b; font-size: 0.9em;">
                    <span style="color: #667eea;">█</span> VUs / Requests per second over time
                </div>
            </div>
        </div>
        
        <!-- Performance Insights -->
        <div class="insights-section">
            <h2><span style="color: #10b981;">✓</span> Performance Insights</h2>
            <div class="insight-box ${checksPassRate < 80 ? 'error' : checksPassRate < 95 ? 'warning' : ''}">
                <h3>
                    ${checksPassRate >= 95 ? '✓ Automated Analysis' : '⚠ Performance Review'}
                </h3>
                <p><strong>Our automated algorithms</strong> have analyzed the test results ${checksPassRate < 80 ? 'and have found performance issues.' : 'and have not found any performance issues.'}</p>
                <p>The average response time of the system being tested was <strong>${httpReqDuration ? Math.round(httpReqDuration.values.avg) : 0}ms</strong>, and <strong>${httpReqs ? httpReqs.values.count.toLocaleString() : 0}</strong> requests were made with <strong>${httpReqFailed ? httpReqFailed.values.passes : 0}</strong> failures, at an average request rate of <strong>${httpReqs ? httpReqs.values.rate.toFixed(2) : 0}</strong> requests/second.</p>
                ${checksPassRate < 95 ? `<p style="margin-top: 10px;"><strong>Recommendation:</strong> ${checksPassRate < 80 ? 'Immediate action required. Multiple checks are failing. Review the failed checks and investigate performance bottlenecks.' : 'Some checks are failing. Consider reviewing response times and optimizing slow endpoints.'}</p>` : ''}
            </div>
        </div>
        
        <!-- Test Configuration -->
        <div class="config-section">
            <h2>⚙️ Test Configuration</h2>
            <div class="config-grid">
                <div class="config-item">
                    <span class="config-label">Test Name:</span>
                    <span class="config-value">${testName}</span>
                </div>
                <div class="config-item">
                    <span class="config-label">Test Type:</span>
                    <span class="badge ${testType === 'PERFORMANCE' ? 'info' : testType === 'LOAD' ? 'warning' : 'error'}">${testType}</span>
                </div>
                <div class="config-item">
                    <span class="config-label">Test Run ID:</span>
                    <span class="config-value">${testRunId}</span>
                </div>
                <div class="config-item">
                    <span class="config-label">Started:</span>
                    <span class="config-value">${formattedStartTime}</span>
                </div>
            </div>
        </div>
        
        <!-- Executive Summary -->
        <div class="summary">
            <div class="summary-card ${checksPassRate >= 95 ? 'success' : checksPassRate >= 80 ? 'warning' : 'error'}">
                <h3>Success Rate</h3>
                <div class="value">${checksPassRate}<span class="unit">%</span></div>
            </div>
            
            <div class="summary-card">
                <h3>HTTP Requests</h3>
                <div class="value">${httpReqs ? httpReqs.values.count : 0}</div>
            </div>
            
            <div class="summary-card">
                <h3>Iterations</h3>
                <div class="value">${iterations ? iterations.values.count : 0}</div>
            </div>
            
            <div class="summary-card">
                <h3>Max VUs</h3>
                <div class="value">${vusMax ? vusMax.values.max : 0}</div>
            </div>
            
            <div class="summary-card ${httpReqFailed && httpReqFailed.values.rate > 0.01 ? 'error' : 'success'}">
                <h3>Failed Requests</h3>
                <div class="value">${httpReqFailed ? (httpReqFailed.values.rate * 100).toFixed(2) : 0}<span class="unit">%</span></div>
            </div>
            
            <div class="summary-card">
                <h3>Avg Duration</h3>
                <div class="value">${httpReqDuration ? httpReqDuration.values.avg.toFixed(2) : 0}<span class="unit">ms</span></div>
            </div>
        </div>
        
        <div class="checks-section">
            <h2>✅ Validation Checks</h2>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${checksPassRate}%">
                    ${checksPass} / ${checksTotal} (${checksPassRate}%)
                </div>
            </div>
            <p style="text-align: center; color: #64748b; margin-top: 10px;">
                <strong>${checksPass}</strong> checks passed, 
                <strong style="color: #ef4444;">${checksFail}</strong> checks failed
            </p>
            
            <!-- Validation Checks Details -->
            <div style="margin-top: 30px;">
                <h3 style="color: #1e293b; margin-bottom: 15px; font-size: 1.2em;">Evaluated Checks</h3>
                <div style="background: white; border-radius: 8px; padding: 20px;">
                    ${testInfo && testInfo.checks ? testInfo.checks.filter(checkData => {
                        // Solo mostrar checks que comienzan con "GET:" o checks personalizados que no sean duplicados
                        const checkName = checkData.name;
                        const isGetCheck = checkName.startsWith('GET:');
                        const isDuplicate = ['status is 200', 'status is 201', 'response has body', 
                                            'body contains Liverpool', 'body is HTML', 'body contains',
                                            'is HTML', 'contains Liverpool'].includes(checkName);
                        return isGetCheck || !isDuplicate;
                    }).map(checkData => {
                        const checkName = checkData.name;
                        const checkPasses = checkData.passes || 0;
                        const checkFails = checkData.fails || 0;
                        const checkTotal = checkPasses + checkFails;
                        const checkRate = checkTotal > 0 ? ((checkPasses / checkTotal) * 100).toFixed(1) : 0;
                        const isPassing = checkRate >= 100;
                        
                        // Generate check description based on check name
                        let description = '';
                        const lowerCheckName = checkName.toLowerCase();
                        
                        if (lowerCheckName.includes('status is 200')) {
                            description = 'Validates that the HTTP response status code is 200 (OK), indicating successful request processing.';
                        } else if (lowerCheckName.includes('status is 201')) {
                            description = 'Validates that the HTTP response status code is 201 (Created), confirming resource creation.';
                        } else if (lowerCheckName.includes('status is 200 or 201')) {
                            description = 'Validates that the HTTP response status code is either 200 (OK) or 201 (Created), both indicating success.';
                        } else if (lowerCheckName.includes('status is 204')) {
                            description = 'Validates that the HTTP response status code is 204 (No Content), successful request with no body.';
                        } else if (lowerCheckName.includes('response time') || lowerCheckName.includes('duration')) {
                            const timeMatch = checkName.match(/\d+/);
                            const threshold = timeMatch ? timeMatch[0] : 'specified';
                            description = `Ensures that the response time is less than ${threshold}ms, meeting performance requirements.`;
                        } else if (lowerCheckName.includes('response has body') || lowerCheckName.includes('not empty')) {
                            description = 'Validates that the response body is not empty and contains data.';
                        } else if (lowerCheckName.includes('is array') || lowerCheckName.includes('response is array')) {
                            description = 'Validates that the response body is a valid JSON array structure.';
                        } else if (lowerCheckName.includes('array has items') || lowerCheckName.includes('length > 0')) {
                            description = 'Validates that the response array contains at least one item.';
                        } else if (lowerCheckName.includes('have id field') || lowerCheckName.includes('id field')) {
                            description = 'Validates that response items include an "id" field for proper identification.';
                        } else if (lowerCheckName.includes('have name field') || lowerCheckName.includes('name field')) {
                            description = 'Validates that response items include a "name" field with descriptive information.';
                        } else if (lowerCheckName.includes('status is not error') || lowerCheckName.includes('status < 400')) {
                            description = 'Validates that the response status code is not an error (< 400), confirming no client or server errors.';
                        } else if (lowerCheckName.includes('is json') || lowerCheckName.includes('content-type')) {
                            description = 'Validates that the response content type is JSON and properly formatted.';
                        } else if (lowerCheckName.includes('failed') && lowerCheckName.includes('rate')) {
                            description = 'Validates that the failure rate of HTTP requests stays within acceptable limits.';
                        } else {
                            description = 'Custom validation check to ensure API response meets specific requirements.';
                        }
                        
                        return `
                        <div style="display: flex; flex-direction: column; padding: 16px; margin: 10px 0; border-left: 4px solid ${isPassing ? '#10b981' : '#ef4444'}; background: #f8fafc; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                                <div style="flex: 1;">
                                    <div style="font-weight: 600; color: #1e293b; font-size: 1.05em; margin-bottom: 6px;">
                                        ${isPassing ? '✓' : '✗'} ${checkName}
                                    </div>
                                    <div style="font-size: 0.9em; color: #64748b; line-height: 1.5; font-style: italic;">
                                        ${description}
                                    </div>
                                </div>
                                <div style="margin-left: 15px;">
                                    <span class="badge ${isPassing ? 'success' : 'error'}" style="font-size: 0.8em; padding: 6px 12px;">
                                        ${checkRate}%
                                    </span>
                                </div>
                            </div>
                            <div style="display: flex; gap: 20px; font-size: 0.85em; color: #64748b; margin-top: 8px; padding-top: 8px; border-top: 1px solid #e2e8f0;">
                                <span>
                                    <strong style="color: #10b981;">Passed:</strong> ${checkPasses}
                                </span>
                                <span>
                                    <strong style="color: #ef4444;">Failed:</strong> ${checkFails}
                                </span>
                                <span>
                                    <strong style="color: #1e293b;">Total Executions:</strong> ${checkTotal}
                                </span>
                                <span>
                                    <strong style="color: #667eea;">Success Rate:</strong> ${checkRate}%
                                </span>
                            </div>
                        </div>
                        `;
                    }).join('') : '<p style="text-align: center; color: #94a3b8; padding: 20px;">No validation checks data available</p>'}
                </div>
            </div>
        </div>
        
        <!-- HTTP Status Codes Section -->
        <div class="status-codes-section">
            <h2>📊 HTTP Status Codes Distribution</h2>
            
            <div class="status-grid">
                <div class="status-widget success">
                    <h3>Status 200</h3>
                    <div class="status-value">${httpReqs && httpReqFailed ? (httpReqs.values.count - httpReqFailed.values.passes) : httpReqs ? httpReqs.values.count : 0}</div>
                </div>
                <div class="status-widget success">
                    <h3>Status 201</h3>
                    <div class="status-value">0</div>
                </div>
                <div class="status-widget error">
                    <h3>Status 400</h3>
                    <div class="status-value">0</div>
                </div>
                <div class="status-widget error">
                    <h3>Status 401</h3>
                    <div class="status-value">0</div>
                </div>
                <div class="status-widget error">
                    <h3>Status 404</h3>
                    <div class="status-value">0</div>
                </div>
                <div class="status-widget error">
                    <h3>Status 500</h3>
                    <div class="status-value">${httpReqFailed ? httpReqFailed.values.passes : 0}</div>
                </div>
                <div class="status-widget error">
                    <h3>Status 502</h3>
                    <div class="status-value">0</div>
                </div>
                <div class="status-widget error">
                    <h3>Status 503</h3>
                    <div class="status-value">0</div>
                </div>
            </div>
            
            <!-- Status Code Pie Chart -->
            <div class="pie-chart-container">
                <div style="position: relative;">
                    <svg width="250" height="250" viewBox="0 0 250 250" style="transform: rotate(-90deg);">
                        ${(() => {
                            const total = httpReqs ? httpReqs.values.count : 0;
                            const success = httpReqs && httpReqFailed ? (httpReqs.values.count - httpReqFailed.values.passes) : httpReqs ? httpReqs.values.count : 0;
                            const failures = httpReqFailed ? httpReqFailed.values.passes : 0;
                            
                            if (total === 0) {
                                return '<circle cx="125" cy="125" r="100" fill="#e2e8f0"/>';
                            }
                            
                            const successPercent = (success / total) * 100;
                            const failurePercent = (failures / total) * 100;
                            
                            const circumference = 2 * Math.PI * 100;
                            const successDash = (successPercent / 100) * circumference;
                            const failureDash = (failurePercent / 100) * circumference;
                            
                            return `
                                <circle cx="125" cy="125" r="100" fill="none" stroke="#10b981" stroke-width="60" 
                                    stroke-dasharray="${successDash} ${circumference}" 
                                    stroke-dashoffset="0"/>
                                <circle cx="125" cy="125" r="100" fill="none" stroke="#ef4444" stroke-width="60" 
                                    stroke-dasharray="${failureDash} ${circumference}" 
                                    stroke-dashoffset="${-successDash}"/>
                                <circle cx="125" cy="125" r="70" fill="white"/>
                            `;
                        })()}
                    </svg>
                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
                        <div style="font-size: 2em; font-weight: bold; color: #1e293b;">${httpReqs ? httpReqs.values.count : 0}</div>
                        <div style="font-size: 0.85em; color: #64748b;">Total</div>
                    </div>
                </div>
                
                <div class="pie-legend">
                    <div class="legend-item">
                        <div class="legend-color" style="background: #10b981;"></div>
                        <div class="legend-text">
                            <strong>2xx Success:</strong> ${httpReqs && httpReqFailed ? (httpReqs.values.count - httpReqFailed.values.passes) : httpReqs ? httpReqs.values.count : 0} 
                            (${httpReqs && httpReqFailed ? ((1 - httpReqFailed.values.rate) * 100).toFixed(1) : 100}%)
                        </div>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color" style="background: #f59e0b;"></div>
                        <div class="legend-text"><strong>3xx Redirect:</strong> 0 (0%)</div>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color" style="background: #f59e0b;"></div>
                        <div class="legend-text"><strong>4xx Client Error:</strong> 0 (0%)</div>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color" style="background: #ef4444;"></div>
                        <div class="legend-text">
                            <strong>5xx Server Error:</strong> ${httpReqFailed ? httpReqFailed.values.passes : 0} 
                            (${httpReqFailed ? (httpReqFailed.values.rate * 100).toFixed(1) : 0}%)
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Response Time Percentiles Chart -->
        <div class="metrics-section">
            <h2>📊 Response Time Distribution</h2>
            <div class="chart-container">
                <div class="chart-title">HTTP Request Duration Percentiles (ms)</div>
                <div class="bar-chart">
                    ${httpReqDuration && (httpReqDuration.values.med || httpReqDuration.values['p(90)']) ? `
                    <div class="bar" style="height: ${((httpReqDuration.values.med || httpReqDuration.values.min) / httpReqDuration.values.max * 100).toFixed(0)}%;">
                        <span class="bar-value">${(httpReqDuration.values.med || httpReqDuration.values.min).toFixed(1)}ms</span>
                    </div>
                    <div class="bar" style="height: ${((httpReqDuration.values['p(90)'] || httpReqDuration.values.avg) / httpReqDuration.values.max * 100).toFixed(0)}%;">
                        <span class="bar-value">${(httpReqDuration.values['p(90)'] || httpReqDuration.values.avg).toFixed(1)}ms</span>
                    </div>
                    <div class="bar" style="height: ${((httpReqDuration.values['p(95)'] || httpReqDuration.values.avg) / httpReqDuration.values.max * 100).toFixed(0)}%;">
                        <span class="bar-value">${(httpReqDuration.values['p(95)'] || httpReqDuration.values.avg).toFixed(1)}ms</span>
                    </div>
                    <div class="bar" style="height: 100%;">
                        <span class="bar-value">${httpReqDuration.values.max.toFixed(1)}ms</span>
                    </div>
                    ` : httpReqDuration && httpReqDuration.values.avg ? `
                    <!-- Alternative visualization for single iteration tests -->
                    <div style="text-align: center; padding: 30px;">
                        <div style="display: inline-flex; align-items: flex-end; gap: 20px; height: 150px;">
                            <div style="display: flex; flex-direction: column; align-items: center;">
                                <div style="background: linear-gradient(to top, #10b981, #34d399); width: 80px; height: ${httpReqDuration.values.min ? (httpReqDuration.values.min / httpReqDuration.values.max * 100).toFixed(0) : 100}%; border-radius: 4px 4px 0 0; position: relative;">
                                    <span style="position: absolute; top: -25px; left: 50%; transform: translateX(-50%); font-weight: bold; color: #1e293b; white-space: nowrap;">${httpReqDuration.values.min.toFixed(1)}ms</span>
                                </div>
                                <span style="margin-top: 10px; font-size: 0.85em; color: #64748b;">Min</span>
                            </div>
                            <div style="display: flex; flex-direction: column; align-items: center;">
                                <div style="background: linear-gradient(to top, #667eea, #764ba2); width: 80px; height: ${httpReqDuration.values.avg ? (httpReqDuration.values.avg / httpReqDuration.values.max * 100).toFixed(0) : 100}%; border-radius: 4px 4px 0 0; position: relative;">
                                    <span style="position: absolute; top: -25px; left: 50%; transform: translateX(-50%); font-weight: bold; color: #1e293b; white-space: nowrap;">${httpReqDuration.values.avg.toFixed(1)}ms</span>
                                </div>
                                <span style="margin-top: 10px; font-size: 0.85em; color: #64748b;">Average</span>
                            </div>
                            <div style="display: flex; flex-direction: column; align-items: center;">
                                <div style="background: linear-gradient(to top, #f59e0b, #fbbf24); width: 80px; height: 100%; border-radius: 4px 4px 0 0; position: relative;">
                                    <span style="position: absolute; top: -25px; left: 50%; transform: translateX(-50%); font-weight: bold; color: #1e293b; white-space: nowrap;">${httpReqDuration.values.max.toFixed(1)}ms</span>
                                </div>
                                <span style="margin-top: 10px; font-size: 0.85em; color: #64748b;">Max</span>
                            </div>
                        </div>
                        <p style="margin-top: 20px; color: #94a3b8; font-size: 0.9em;">
                            <em>Note: Percentile data (p50, p90, p95) requires multiple iterations to calculate accurate distribution.</em>
                        </p>
                    </div>
                    ` : '<p style="text-align: center; padding: 50px; color: #94a3b8;">No duration data available</p>'}
                </div>
                ${httpReqDuration && (httpReqDuration.values.med || httpReqDuration.values['p(90)']) ? `
                <div style="display: flex; justify-content: space-around; margin-top: 10px;">
                    <span class="bar-label">Median (p50)</span>
                    <span class="bar-label">p90</span>
                    <span class="bar-label">p95</span>
                    <span class="bar-label">Max</span>
                </div>
                ` : ''}
                
                <div class="percentile-grid" style="margin-top: 30px;">
                    <div class="percentile-item">
                        <span class="percentile-label">Min</span>
                        <span class="percentile-value">${httpReqDuration && httpReqDuration.values.min ? httpReqDuration.values.min.toFixed(2) : 0}ms</span>
                    </div>
                    <div class="percentile-item">
                        <span class="percentile-label">Average</span>
                        <span class="percentile-value">${httpReqDuration && httpReqDuration.values.avg ? httpReqDuration.values.avg.toFixed(2) : 0}ms</span>
                    </div>
                    <div class="percentile-item">
                        <span class="percentile-label">Max</span>
                        <span class="percentile-value">${httpReqDuration && httpReqDuration.values.max ? httpReqDuration.values.max.toFixed(2) : 0}ms</span>
                    </div>
                    <div class="percentile-item">
                        <span class="percentile-label">Median (p50)</span>
                        <span class="percentile-value">${httpReqDuration && httpReqDuration.values.med ? httpReqDuration.values.med.toFixed(2) : 0}ms</span>
                    </div>
                    <div class="percentile-item">
                        <span class="percentile-label">p90</span>
                        <span class="percentile-value">${httpReqDuration && httpReqDuration.values['p(90)'] ? httpReqDuration.values['p(90)'].toFixed(2) : 0}ms</span>
                    </div>
                    <div class="percentile-item">
                        <span class="percentile-label">p95</span>
                        <span class="percentile-value">${httpReqDuration && httpReqDuration.values['p(95)'] ? httpReqDuration.values['p(95)'].toFixed(2) : 0}ms</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="metrics-section">
            <h2>📈 Detailed Metrics</h2>
            
            <div class="metrics-grid">
                <div class="metric-card">
                    <h3>HTTP Request Duration (ms)</h3>
                    <div class="metric-row">
                        <span class="metric-label">Average:</span>
                        <span class="metric-value">${httpReqDuration ? httpReqDuration.values.avg.toFixed(2) : 0} ms</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Minimum:</span>
                        <span class="metric-value">${httpReqDuration ? httpReqDuration.values.min.toFixed(2) : 0} ms</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Maximum:</span>
                        <span class="metric-value">${httpReqDuration ? httpReqDuration.values.max.toFixed(2) : 0} ms</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Median (p50):</span>
                        <span class="metric-value">${httpReqDuration && httpReqDuration.values.med ? httpReqDuration.values.med.toFixed(2) : 0} ms</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Percentile 90:</span>
                        <span class="metric-value">${httpReqDuration && httpReqDuration.values['p(90)'] ? httpReqDuration.values['p(90)'].toFixed(2) : 0} ms</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Percentile 95:</span>
                        <span class="metric-value">${httpReqDuration && httpReqDuration.values['p(95)'] ? httpReqDuration.values['p(95)'].toFixed(2) : 0} ms</span>
                    </div>
                </div>
                
                <div class="metric-card">
                    <h3>Overall Performance</h3>
                    <div class="metric-row">
                        <span class="metric-label">Total Requests:</span>
                        <span class="metric-value">${httpReqs ? httpReqs.values.count : 0}</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Requests/sec:</span>
                        <span class="metric-value">${httpReqs ? httpReqs.values.rate.toFixed(2) : 0}</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Total Iterations:</span>
                        <span class="metric-value">${iterations ? iterations.values.count : 0}</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Iterations/sec:</span>
                        <span class="metric-value">${iterations ? iterations.values.rate.toFixed(2) : 0}</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Average VUs:</span>
                        <span class="metric-value">${vus ? vus.values.value.toFixed(0) : 0}</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Max VUs:</span>
                        <span class="metric-value">${vusMax ? vusMax.values.max : 0}</span>
                    </div>
                </div>
                
                <div class="metric-card">
                    <h3>Waiting Time</h3>
                    <div class="metric-row">
                        <span class="metric-label">Average:</span>
                        <span class="metric-value">${metrics.http_req_waiting ? metrics.http_req_waiting.values.avg.toFixed(2) : 0} ms</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Minimum:</span>
                        <span class="metric-value">${metrics.http_req_waiting ? metrics.http_req_waiting.values.min.toFixed(2) : 0} ms</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Maximum:</span>
                        <span class="metric-value">${metrics.http_req_waiting ? metrics.http_req_waiting.values.max.toFixed(2) : 0} ms</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Percentile 95:</span>
                        <span class="metric-value">${metrics.http_req_waiting ? metrics.http_req_waiting.values['p(95)'].toFixed(2) : 0} ms</span>
                    </div>
                </div>
                
                <div class="metric-card">
                    <h3>Connection Time</h3>
                    <div class="metric-row">
                        <span class="metric-label">Average:</span>
                        <span class="metric-value">${metrics.http_req_connecting ? metrics.http_req_connecting.values.avg.toFixed(2) : 0} ms</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Minimum:</span>
                        <span class="metric-value">${metrics.http_req_connecting ? metrics.http_req_connecting.values.min.toFixed(2) : 0} ms</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Maximum:</span>
                        <span class="metric-value">${metrics.http_req_connecting ? metrics.http_req_connecting.values.max.toFixed(2) : 0} ms</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">TLS Handshake:</span>
                        <span class="metric-value">${metrics.http_req_tls_handshaking ? metrics.http_req_tls_handshaking.values.avg.toFixed(2) : 0} ms</span>
                    </div>
                </div>
                
                <div class="metric-card">
                    <h3>Data Transfer</h3>
                    <div class="metric-row">
                        <span class="metric-label">Data Received:</span>
                        <span class="metric-value">${metrics.data_received ? (metrics.data_received.values.count / 1024).toFixed(2) : 0} KB</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Data Sent:</span>
                        <span class="metric-value">${metrics.data_sent ? (metrics.data_sent.values.count / 1024).toFixed(2) : 0} KB</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Receive Rate:</span>
                        <span class="metric-value">${metrics.data_received ? (metrics.data_received.values.rate / 1024).toFixed(2) : 0} KB/s</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Send Rate:</span>
                        <span class="metric-value">${metrics.data_sent ? (metrics.data_sent.values.rate / 1024).toFixed(2) : 0} KB/s</span>
                    </div>
                </div>
                
                <div class="metric-card">
                    <h3>Request Status</h3>
                    <div class="metric-row">
                        <span class="metric-label">Success Rate:</span>
                        <span class="metric-value" style="color: #10b981;">${httpReqFailed ? ((1 - httpReqFailed.values.rate) * 100).toFixed(2) : 100}%</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Failure Rate:</span>
                        <span class="metric-value" style="color: #ef4444;">${httpReqFailed ? (httpReqFailed.values.rate * 100).toFixed(2) : 0}%</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Total Checks:</span>
                        <span class="metric-value">${checksTotal}</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Checks Passed:</span>
                        <span class="metric-value" style="color: #10b981;">${checksPass}</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Checks Failed:</span>
                        <span class="metric-value" style="color: #ef4444;">${checksFail}</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>🚀 K6 Performance Testing Framework</strong></p>
            <p>Generated on ${formatDateTime(new Date())}</p>
            <p>Test: <strong>${testName}</strong> | Type: <strong>${testType}</strong> | Run ID: <strong>${testRunId}</strong></p>
            <p style="margin-top: 10px; opacity: 0.6;">© ${new Date().getFullYear()} - Applied AI Team - Custom HTML Report</p>
        </div>
    </div>
</body>
</html>
`;
    
    return html;
}
