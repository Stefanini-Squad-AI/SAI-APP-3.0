const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

const TRX_PATH = path.join(__dirname, 'TestResults', 'test-results.trx');
const TEST_RESULTS_DIR = path.join(__dirname, 'TestResults');
const HTML_REPORT_PATH = path.join(__dirname, 'TestResults', 'test-report.html');
const MARKDOWN_REPORT_PATH = path.join(__dirname, 'TestResults', 'test-report.md');

// Find coverage file recursively
function findCoberturaFile(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            const found = findCoberturaFile(fullPath);
            if (found) return found;
        } else if (file === 'coverage.cobertura.xml') {
            return fullPath;
        }
    }
    
    return null;
}

// Parse TRX file
async function parseTrxFile() {
    if (!fs.existsSync(TRX_PATH)) {
        console.error(`TRX file not found: ${TRX_PATH}`);
        process.exit(1);
    }

    const trxContent = fs.readFileSync(TRX_PATH, 'utf-8');
    const parser = new xml2js.Parser();
    return await parser.parseStringPromise(trxContent);
}

// Parse Cobertura file
async function parseCoberturaFile() {
    const COBERTURA_PATH = findCoberturaFile(TEST_RESULTS_DIR);
    
    if (!COBERTURA_PATH) {
        console.warn(`Coverage file not found in: ${TEST_RESULTS_DIR}`);
        return null;
    }

    console.log(`   📁 Archivo encontrado: ${COBERTURA_PATH}`);
    const coberturaContent = fs.readFileSync(COBERTURA_PATH, 'utf-8');
    const parser = new xml2js.Parser();
    return await parser.parseStringPromise(coberturaContent);
}

// Extract test info from TRX
function extractTestInfo(trxData) {
    const testRun = trxData.TestRun;
    const results = testRun.Results?.[0]?.UnitTestResult || [];
    const counters = testRun.ResultSummary?.[0]?.Counters?.[0]?.$;
    const definitions = testRun.TestDefinitions?.[0]?.UnitTest || [];

    const definitionsMap = {};
    definitions.forEach(def => {
        const testId = def.$.id;
        const testMethod = def.TestMethod?.[0]?.$;
        definitionsMap[testId] = {
            className: testMethod?.className || 'Unknown',
            fullName: testMethod?.className + '.' + (testMethod?.name || 'Unknown')
        };
    });

    const tests = results.map(test => {
        const attrs = test.$;
        const testId = attrs.testId;
        const definition = definitionsMap[testId] || {};
        
        return {
            name: attrs.testName || 'Unknown Test',
            outcome: attrs.outcome || 'Unknown',
            duration: attrs.duration || '00:00:00',
            className: definition.className,
            fullName: definition.fullName,
            errorMessage: test.Output?.[0]?.ErrorInfo?.[0]?.Message?.[0] || null,
            stackTrace: test.Output?.[0]?.ErrorInfo?.[0]?.StackTrace?.[0] || null
        };
    });

    return {
        total: parseInt(counters?.total || 0),
        passed: parseInt(counters?.passed || 0),
        failed: parseInt(counters?.failed || 0),
        skipped: parseInt(counters?.inconclusive || 0),
        tests
    };
}

// Extract coverage info
function extractCoverageInfo(coberturaData) {
    if (!coberturaData) return null;

    const coverage = coberturaData.coverage;
    const packages = coverage.packages?.[0]?.package || [];
    
    const lineRate = parseFloat(coverage.$['line-rate'] || 0) * 100;
    const branchRate = parseFloat(coverage.$['branch-rate'] || 0) * 100;
    
    const packageDetails = packages.map(pkg => {
        const pkgName = pkg.$.name || 'Unknown';
        const pkgLineRate = parseFloat(pkg.$['line-rate'] || 0) * 100;
        const pkgBranchRate = parseFloat(pkg.$['branch-rate'] || 0) * 100;
        
        const classes = pkg.classes?.[0]?.class || [];
        const classDetails = classes.map(cls => {
            const className = cls.$.name || 'Unknown';
            const filename = cls.$.filename || '';
            const clsLineRate = parseFloat(cls.$['line-rate'] || 0) * 100;
            const clsBranchRate = parseFloat(cls.$['branch-rate'] || 0) * 100;
            
            const lines = cls.lines?.[0]?.line || [];
            const totalLines = lines.length;
            const coveredLines = lines.filter(l => parseInt(l.$.hits) > 0).length;
            
            return {
                name: className,
                filename,
                lineRate: clsLineRate,
                branchRate: clsBranchRate,
                totalLines,
                coveredLines,
                uncoveredLines: totalLines - coveredLines
            };
        });
        
        return {
            name: pkgName,
            lineRate: pkgLineRate,
            branchRate: pkgBranchRate,
            classes: classDetails
        };
    });
    
    return {
        lineRate,
        branchRate,
        packages: packageDetails
    };
}

// Generate rich HTML report
function generateHtmlReport(testInfo, coverageInfo) {
    const passRate = testInfo.total > 0 
        ? ((testInfo.passed / testInfo.total) * 100).toFixed(2) 
        : 0;

    const testsByClass = {};
    testInfo.tests.forEach(test => {
        const className = test.className || 'Unknown';
        if (!testsByClass[className]) {
            testsByClass[className] = [];
        }
        testsByClass[className].push(test);
    });

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Backend Unit Tests Report</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            min-height: 100vh;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            font-weight: 700;
        }
        .header p {
            font-size: 1.2em;
            opacity: 0.9;
        }
        
        /* Summary Cards */
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            padding: 40px;
            background: #f8f9fa;
        }
        .summary-card {
            background: white;
            padding: 24px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            text-align: center;
            border-left: 4px solid #667eea;
        }
        .summary-card.passed { border-left-color: #10b981; }
        .summary-card.failed { border-left-color: #ef4444; }
        .summary-card.skipped { border-left-color: #f59e0b; }
        .summary-card .value {
            font-size: 3em;
            font-weight: 700;
            margin-bottom: 8px;
        }
        .summary-card .label {
            font-size: 0.9em;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .summary-card.passed .value { color: #10b981; }
        .summary-card.failed .value { color: #ef4444; }
        .summary-card.skipped .value { color: #f59e0b; }
        
        /* Charts Section */
        .charts-section {
            padding: 40px;
            background: #f8f9fa;
            border-top: 1px solid #e5e7eb;
        }
        .charts-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px;
            margin-top: 20px;
        }
        .chart-card {
            background: white;
            padding: 24px;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .chart-title {
            font-size: 1.2em;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 20px;
            text-align: center;
        }
        .chart-canvas {
            max-height: 300px;
        }
        
        /* Coverage Tables */
        .coverage-section {
            padding: 40px;
            background: white;
        }
        .section-title {
            font-size: 1.8em;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 24px;
            padding-bottom: 12px;
            border-bottom: 3px solid #667eea;
        }
        .coverage-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            background: white;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            border-radius: 8px;
            overflow: hidden;
        }
        .coverage-table thead {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .coverage-table th {
            padding: 16px;
            text-align: left;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.85em;
            letter-spacing: 0.5px;
        }
        .coverage-table td {
            padding: 14px 16px;
            border-bottom: 1px solid #e5e7eb;
        }
        .coverage-table tbody tr:hover {
            background: #f9fafb;
        }
        .coverage-bar-container {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .coverage-bar {
            flex: 1;
            height: 20px;
            background: #e5e7eb;
            border-radius: 10px;
            overflow: hidden;
            position: relative;
        }
        .coverage-bar-fill {
            height: 100%;
            background: linear-gradient(90deg, #10b981 0%, #059669 100%);
            transition: width 0.5s ease;
        }
        .coverage-bar-fill.medium {
            background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%);
        }
        .coverage-bar-fill.low {
            background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%);
        }
        .coverage-percentage {
            min-width: 50px;
            text-align: right;
            font-weight: 600;
            font-size: 0.9em;
        }
        
        /* Accordion Tests */
        .tests-section {
            padding: 40px;
            background: white;
            border-top: 1px solid #e5e7eb;
        }
        .accordion {
            margin-bottom: 16px;
        }
        .accordion-header {
            background: #f9fafb;
            padding: 16px 20px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: space-between;
            transition: all 0.2s;
        }
        .accordion-header:hover {
            background: #f3f4f6;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .accordion-header.active {
            background: white;
            border-bottom-left-radius: 0;
            border-bottom-right-radius: 0;
            border-bottom-color: transparent;
        }
        .accordion-title {
            display: flex;
            align-items: center;
            gap: 12px;
            flex: 1;
        }
        .accordion-icon {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 0.85em;
            transition: transform 0.2s;
        }
        .accordion-icon.passed {
            background: #10b981;
            color: white;
        }
        .accordion-icon.failed {
            background: #ef4444;
            color: white;
        }
        .accordion-name {
            font-weight: 600;
            color: #1f2937;
        }
        .accordion-stats {
            display: flex;
            gap: 16px;
            color: #6b7280;
            font-size: 0.9em;
        }
        .accordion-arrow {
            transition: transform 0.2s;
        }
        .accordion-header.active .accordion-arrow {
            transform: rotate(180deg);
        }
        .accordion-content {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease;
            border: 1px solid #e5e7eb;
            border-top: none;
            border-bottom-left-radius: 8px;
            border-bottom-right-radius: 8px;
        }
        .accordion-content.show {
            max-height: 2000px;
        }
        .accordion-body {
            padding: 20px;
            background: white;
        }
        .test-item {
            background: #f9fafb;
            margin-bottom: 12px;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
            overflow: hidden;
        }
        .test-header {
            padding: 14px 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            cursor: pointer;
            transition: background 0.2s;
        }
        .test-header:hover {
            background: #f3f4f6;
        }
        .test-info {
            display: flex;
            align-items: center;
            gap: 12px;
            flex: 1;
        }
        .test-status {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 0.75em;
        }
        .test-status.passed {
            background: #10b981;
            color: white;
        }
        .test-status.failed {
            background: #ef4444;
            color: white;
        }
        .test-name {
            font-weight: 500;
            color: #374151;
            font-size: 0.9em;
        }
        .test-duration {
            color: #6b7280;
            font-size: 0.85em;
            padding: 4px 10px;
            background: white;
            border-radius: 12px;
            border: 1px solid #e5e7eb;
        }
        .test-details {
            padding: 16px;
            background: white;
            border-top: 1px solid #e5e7eb;
            display: none;
        }
        .test-item.expanded .test-details {
            display: block;
        }
        .error-message {
            background: #fef2f2;
            border-left: 4px solid #ef4444;
            padding: 16px;
            border-radius: 4px;
            margin-bottom: 12px;
        }
        .error-title {
            font-weight: 600;
            color: #991b1b;
            margin-bottom: 8px;
        }
        .error-content {
            color: #7f1d1d;
            font-family: 'Courier New', monospace;
            font-size: 0.85em;
            white-space: pre-wrap;
            word-break: break-word;
        }
        .stack-trace {
            background: #f3f4f6;
            border-left: 4px solid #6b7280;
            padding: 16px;
            border-radius: 4px;
        }
        .stack-trace-title {
            font-weight: 600;
            color: #374151;
            margin-bottom: 8px;
        }
        .stack-trace-content {
            color: #4b5563;
            font-family: 'Courier New', monospace;
            font-size: 0.8em;
            white-space: pre-wrap;
            word-break: break-word;
            overflow-x: auto;
            max-height: 400px;
            overflow-y: auto;
        }
        
        .footer {
            background: #f8f9fa;
            padding: 24px;
            text-align: center;
            color: #6b7280;
            font-size: 0.9em;
            border-top: 1px solid #e5e7eb;
        }
        .timestamp {
            font-weight: 600;
            color: #374151;
        }
        
        @media (max-width: 768px) {
            .summary {
                grid-template-columns: 1fr;
            }
            .charts-grid {
                grid-template-columns: 1fr;
            }
            .header h1 {
                font-size: 1.8em;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 Backend Unit Tests Report</h1>
            <p>.NET 8 | xUnit | Moq | FluentAssertions | Coverlet</p>
        </div>

        <!-- Summary Cards -->
        <div class="summary">
            <div class="summary-card">
                <div class="value">${testInfo.total}</div>
                <div class="label">Total Tests</div>
            </div>
            <div class="summary-card passed">
                <div class="value">${testInfo.passed}</div>
                <div class="label">Passed</div>
            </div>
            <div class="summary-card failed">
                <div class="value">${testInfo.failed}</div>
                <div class="label">Failed</div>
            </div>
            <div class="summary-card skipped">
                <div class="value">${testInfo.skipped}</div>
                <div class="label">Skipped</div>
            </div>
        </div>

        <!-- Charts Section -->
        <div class="charts-section">
            <h2 class="section-title">📊 Test Results Overview</h2>
            <div class="charts-grid">
                <div class="chart-card">
                    <h3 class="chart-title">Test Distribution</h3>
                    <canvas id="testsPieChart" class="chart-canvas"></canvas>
                </div>
                ${coverageInfo ? `
                <div class="chart-card">
                    <h3 class="chart-title">Code Coverage</h3>
                    <canvas id="coverageChart" class="chart-canvas"></canvas>
                </div>
                ` : ''}
            </div>
        </div>

        ${coverageInfo ? generateCoverageSections(coverageInfo) : ''}

        <!-- Tests Section with Accordion -->
        <div class="tests-section">
            <h2 class="section-title">📝 Test Details by Class</h2>
            ${Object.keys(testsByClass).map((className, idx) => {
                const classTests = testsByClass[className];
                const classPassed = classTests.filter(t => t.outcome === 'Passed').length;
                const classFailed = classTests.filter(t => t.outcome === 'Failed').length;
                const classPassRate = ((classPassed / classTests.length) * 100).toFixed(1);
                
                return `
                <div class="accordion">
                    <div class="accordion-header" onclick="toggleAccordion(${idx})">
                        <div class="accordion-title">
                            <div class="accordion-icon ${classFailed > 0 ? 'failed' : 'passed'}">
                                ${classFailed > 0 ? '✗' : '✓'}
                            </div>
                            <div class="accordion-name">${className}</div>
                        </div>
                        <div class="accordion-stats">
                            <span>✅ ${classPassed}</span>
                            <span>❌ ${classFailed}</span>
                            <span>📈 ${classPassRate}%</span>
                            <span>${classTests.length} tests</span>
                        </div>
                        <div class="accordion-arrow">▼</div>
                    </div>
                    <div class="accordion-content" id="accordion-${idx}">
                        <div class="accordion-body">
                            ${classTests.map((test, testIdx) => `
                                <div class="test-item ${test.errorMessage ? 'expanded' : ''}" onclick="event.stopPropagation(); this.classList.toggle('expanded')">
                                    <div class="test-header">
                                        <div class="test-info">
                                            <div class="test-status ${test.outcome.toLowerCase()}">
                                                ${test.outcome === 'Passed' ? '✓' : '✗'}
                                            </div>
                                            <div class="test-name">${test.name}</div>
                                        </div>
                                        <div class="test-duration">${formatDuration(test.duration)}</div>
                                    </div>
                                    ${test.errorMessage || test.stackTrace ? `
                                        <div class="test-details">
                                            ${test.errorMessage ? `
                                                <div class="error-message">
                                                    <div class="error-title">❌ Error Message</div>
                                                    <div class="error-content">${escapeHtml(test.errorMessage)}</div>
                                                </div>
                                            ` : ''}
                                            ${test.stackTrace ? `
                                                <div class="stack-trace">
                                                    <div class="stack-trace-title">📋 Stack Trace</div>
                                                    <div class="stack-trace-content">${escapeHtml(test.stackTrace)}</div>
                                                </div>
                                            ` : ''}
                                        </div>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                `;
            }).join('')}
        </div>

        <div class="footer">
            <div class="timestamp">Generated on ${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'long' })}</div>
        </div>
    </div>

    <script>
        // Toggle accordion
        function toggleAccordion(index) {
            const header = document.querySelectorAll('.accordion-header')[index];
            const content = document.getElementById('accordion-' + index);
            
            header.classList.toggle('active');
            content.classList.toggle('show');
        }

        // Pie Chart for Tests
        const testsPieCtx = document.getElementById('testsPieChart');
        if (testsPieCtx) {
            new Chart(testsPieCtx, {
                type: 'pie',
                data: {
                    labels: ['Passed', 'Failed', 'Skipped'],
                    datasets: [{
                        data: [${testInfo.passed}, ${testInfo.failed}, ${testInfo.skipped}],
                        backgroundColor: [
                            'rgba(16, 185, 129, 0.8)',
                            'rgba(239, 68, 68, 0.8)',
                            'rgba(245, 158, 11, 0.8)'
                        ],
                        borderColor: [
                            'rgba(16, 185, 129, 1)',
                            'rgba(239, 68, 68, 1)',
                            'rgba(245, 158, 11, 1)'
                        ],
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                font: {
                                    size: 12,
                                    weight: '600'
                                },
                                padding: 15
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.parsed || 0;
                                    const total = ${testInfo.total};
                                    const percentage = ((value / total) * 100).toFixed(1);
                                    return label + ': ' + value + ' (' + percentage + '%)';
                                }
                            }
                        }
                    }
                }
            });
        }

        ${coverageInfo ? `
        // Coverage Chart
        const coverageCtx = document.getElementById('coverageChart');
        if (coverageCtx) {
            new Chart(coverageCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Line Coverage', 'Branch Coverage', 'Uncovered'],
                    datasets: [{
                        data: [${coverageInfo.lineRate.toFixed(2)}, ${coverageInfo.branchRate.toFixed(2)}, ${(100 - (coverageInfo.lineRate + coverageInfo.branchRate) / 2).toFixed(2)}],
                        backgroundColor: [
                            'rgba(16, 185, 129, 0.8)',
                            'rgba(59, 130, 246, 0.8)',
                            'rgba(156, 163, 175, 0.8)'
                        ],
                        borderColor: [
                            'rgba(16, 185, 129, 1)',
                            'rgba(59, 130, 246, 1)',
                            'rgba(156, 163, 175, 1)'
                        ],
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                font: {
                                    size: 12,
                                    weight: '600'
                                },
                                padding: 15
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.parsed || 0;
                                    return label + ': ' + value.toFixed(2) + '%';
                                }
                            }
                        }
                    }
                }
            });
        }
        ` : ''}
    </script>
</body>
</html>
    `.trim();

    return html;
}

function generateCoverageSections(coverageInfo) {
    return `
        <!-- Coverage Summary -->
        <div class="coverage-section">
            <h2 class="section-title">📈 Coverage Summary</h2>
            <table class="coverage-table">
                <thead>
                    <tr>
                        <th>Module</th>
                        <th>Line Coverage</th>
                        <th>Branch Coverage</th>
                    </tr>
                </thead>
                <tbody>
                    ${coverageInfo.packages.map(pkg => `
                        <tr>
                            <td><strong>${pkg.name}</strong></td>
                            <td>
                                <div class="coverage-bar-container">
                                    <div class="coverage-bar">
                                        <div class="coverage-bar-fill ${getCoverageClass(pkg.lineRate)}" style="width: ${pkg.lineRate}%"></div>
                                    </div>
                                    <div class="coverage-percentage">${pkg.lineRate.toFixed(2)}%</div>
                                </div>
                            </td>
                            <td>
                                <div class="coverage-bar-container">
                                    <div class="coverage-bar">
                                        <div class="coverage-bar-fill ${getCoverageClass(pkg.branchRate)}" style="width: ${pkg.branchRate}%"></div>
                                    </div>
                                    <div class="coverage-percentage">${pkg.branchRate.toFixed(2)}%</div>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <!-- Coverage Breakdown by Source File -->
        <div class="coverage-section">
            <h2 class="section-title">📄 Coverage Breakdown by Source File</h2>
            ${coverageInfo.packages.map(pkg => `
                ${pkg.classes.length > 0 ? `
                    <h3 style="margin-top: 20px; color: #374151; font-size: 1.2em;">${pkg.name}</h3>
                    <table class="coverage-table">
                        <thead>
                            <tr>
                                <th>File</th>
                                <th>Lines</th>
                                <th>Line Coverage</th>
                                <th>Branch Coverage</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${pkg.classes.map(cls => `
                                <tr>
                                    <td><code>${cls.name}</code></td>
                                    <td>
                                        <span style="color: #10b981; font-weight: 600;">${cls.coveredLines}</span> / 
                                        <span style="color: #6b7280;">${cls.totalLines}</span>
                                    </td>
                                    <td>
                                        <div class="coverage-bar-container">
                                            <div class="coverage-bar">
                                                <div class="coverage-bar-fill ${getCoverageClass(cls.lineRate)}" style="width: ${cls.lineRate}%"></div>
                                            </div>
                                            <div class="coverage-percentage">${cls.lineRate.toFixed(2)}%</div>
                                        </div>
                                    </td>
                                    <td>
                                        <div class="coverage-bar-container">
                                            <div class="coverage-bar">
                                                <div class="coverage-bar-fill ${getCoverageClass(cls.branchRate)}" style="width: ${cls.branchRate}%"></div>
                                            </div>
                                            <div class="coverage-percentage">${cls.branchRate.toFixed(2)}%</div>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                ` : ''}
            `).join('')}
        </div>
    `;
}

function getCoverageClass(rate) {
    if (rate >= 70) return '';
    if (rate >= 40) return 'medium';
    return 'low';
}

// Generate simplified Markdown summary (without per-test details)
function generateMarkdownReport(testInfo, coverageInfo) {
    const passRate = testInfo.total > 0 
        ? ((testInfo.passed / testInfo.total) * 100).toFixed(2) 
        : 0;

    let markdown = `## 📊 Test Summary\n\n`;
    markdown += `| Metric | Value |\n`;
    markdown += `|--------|-------|\n`;
    markdown += `| **Total Tests** | ${testInfo.total} |\n`;
    markdown += `| **✅ Passed** | ${testInfo.passed} |\n`;
    markdown += `| **❌ Failed** | ${testInfo.failed} |\n`;
    markdown += `| **⚪ Skipped** | ${testInfo.skipped} |\n`;
    markdown += `| **📈 Pass Rate** | ${passRate}% |\n\n`;

    if (coverageInfo) {
        markdown += `## 📈 Coverage Summary\n\n`;
        markdown += `| Module | Line Coverage | Branch Coverage |\n`;
        markdown += `|--------|---------------|----------------|\n`;
        coverageInfo.packages.forEach(pkg => {
            markdown += `| **${pkg.name}** | ${pkg.lineRate.toFixed(2)}% | ${pkg.branchRate.toFixed(2)}% |\n`;
        });
        markdown += `\n`;
    }

    markdown += `> Download artifact **backend-unit-test-results** for the complete report with per-test details.\n`;

    return markdown;
}

// Helpers
function formatDuration(duration) {
    const parts = duration.split(':');
    if (parts.length !== 3) return duration;
    
    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    const seconds = parseFloat(parts[2]);
    
    if (hours > 0) return `${hours}h ${minutes}m ${seconds.toFixed(2)}s`;
    if (minutes > 0) return `${minutes}m ${seconds.toFixed(2)}s`;
    if (seconds >= 1) return `${seconds.toFixed(2)}s`;
    return `${(seconds * 1000).toFixed(0)}ms`;
}

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Main
async function main() {
    try {
        console.log('Parsing TRX file...');
        const trxData = await parseTrxFile();
        
        console.log('Extracting test information...');
        const testInfo = extractTestInfo(trxData);
        
        console.log('Parsing coverage file...');
        const coberturaData = await parseCoberturaFile();
        const coverageInfo = extractCoverageInfo(coberturaData);
        
        console.log('\nTest summary:');
        console.log(`   Total: ${testInfo.total}`);
        console.log(`   Passed: ${testInfo.passed}`);
        console.log(`   Failed: ${testInfo.failed}`);
        console.log(`   Skipped: ${testInfo.skipped}`);
        
        if (coverageInfo) {
            console.log('\nCode coverage:');
            console.log(`   Lines: ${coverageInfo.lineRate.toFixed(2)}%`);
            console.log(`   Branches: ${coverageInfo.branchRate.toFixed(2)}%`);
        }
        
        console.log('\nGenerating HTML report...');
        const htmlReport = generateHtmlReport(testInfo, coverageInfo);
        fs.writeFileSync(HTML_REPORT_PATH, htmlReport, 'utf-8');
        console.log(`   HTML generated: ${HTML_REPORT_PATH}`);
        
        console.log('\nGenerating Markdown report...');
        const markdownReport = generateMarkdownReport(testInfo, coverageInfo);
        fs.writeFileSync(MARKDOWN_REPORT_PATH, markdownReport, 'utf-8');
        console.log(`   Markdown generated: ${MARKDOWN_REPORT_PATH}`);
        
        console.log('\nReports generated successfully.\n');
        
        process.exit(testInfo.failed > 0 ? 1 : 0);
    } catch (error) {
        console.error('Failed to generate reports:', error);
        process.exit(1);
    }
}

main();
