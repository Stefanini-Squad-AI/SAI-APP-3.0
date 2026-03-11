#!/usr/bin/env node

/**
 * Generador de Reporte HTML de Pruebas Unitarias
 * 
 * Este script lee el archivo junit.xml generado por Jest y crea un reporte HTML
 * con todos los detalles de las pruebas ejecutadas.
 */

const fs = require('fs');
const path = require('path');
const { parseStringPromise } = require('xml2js');

// Configuración de rutas
const JUNIT_XML_PATH = path.join(__dirname, 'test-results/jest/junit.xml');
const OUTPUT_HTML_PATH = path.join(__dirname, 'test-results/jest/test-report.html');
const OUTPUT_MARKDOWN_PATH = path.join(__dirname, 'test-results/jest/test-report.md');

// Colores para estados
const STATUS_COLORS = {
  passed: '#10b981',   // Verde
  failed: '#ef4444',   // Rojo
  skipped: '#f59e0b'   // Amarillo
};

/**
 * Lee y parsea el archivo junit.xml
 */
async function parseJunitXml() {
  try {
    const xmlContent = fs.readFileSync(JUNIT_XML_PATH, 'utf-8');
    const result = await parseStringPromise(xmlContent);
    return result;
  } catch (error) {
    console.error('Error al leer o parsear junit.xml:', error.message);
    throw error;
  }
}

/**
 * Extrae estadísticas del XML parseado
 */
function extractStats(parsedXml) {
  const testsuites = parsedXml.testsuites;
  const stats = {
    total: parseInt(testsuites.$.tests) || 0,
    failures: parseInt(testsuites.$.failures) || 0,
    errors: parseInt(testsuites.$.errors) || 0,
    time: parseFloat(testsuites.$.time) || 0,
    timestamp: new Date().toISOString()
  };
  
  stats.passed = stats.total - stats.failures - stats.errors;
  stats.skipped = 0; // Jest no reporta skipped en testsuites root
  
  return stats;
}

/**
 * Extrae los detalles de cada test suite
 */
function extractTestSuites(parsedXml) {
  const testsuites = parsedXml.testsuites.testsuite || [];
  
  return testsuites.map(suite => {
    const cases = suite.testcase || [];
    
    return {
      name: suite.$.name,
      tests: parseInt(suite.$.tests) || 0,
      failures: parseInt(suite.$.failures) || 0,
      errors: parseInt(suite.$.errors) || 0,
      skipped: parseInt(suite.$.skipped) || 0,
      time: parseFloat(suite.$.time) || 0,
      timestamp: suite.$.timestamp,
      testcases: cases.map(testcase => ({
        classname: testcase.$.classname,
        name: testcase.$.name,
        time: parseFloat(testcase.$.time) || 0,
        status: testcase.failure ? 'failed' : testcase.error ? 'error' : 'passed',
        failure: testcase.failure ? testcase.failure[0]._ || testcase.failure[0] : null
      }))
    };
  });
}

/**
 * Genera el HTML del reporte
 */
function generateHtmlReport(stats, testSuites) {
  const passRate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(2) : 0;
  
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reporte de Pruebas Unitarias - Frontend</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: #f3f4f6;
      color: #1f2937;
      line-height: 1.6;
      padding: 20px;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    
    .header h1 {
      font-size: 2em;
      margin-bottom: 10px;
    }
    
    .header p {
      opacity: 0.9;
      font-size: 0.95em;
    }
    
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      padding: 30px;
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .stat-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }
    
    .stat-card h3 {
      font-size: 0.85em;
      text-transform: uppercase;
      color: #6b7280;
      margin-bottom: 10px;
      letter-spacing: 0.5px;
    }
    
    .stat-card .value {
      font-size: 2.5em;
      font-weight: bold;
      margin-bottom: 5px;
    }
    
    .stat-card.total .value { color: #dc2626; }
    .stat-card.passed .value { color: ${STATUS_COLORS.passed}; }
    .stat-card.failed .value { color: ${STATUS_COLORS.failed}; }
    .stat-card.rate .value { color: #8b5cf6; }
    
    .progress-bar {
      width: 100%;
      height: 8px;
      background: #e5e7eb;
      border-radius: 4px;
      overflow: hidden;
      margin-top: 10px;
    }
    
    .progress-fill {
      height: 100%;
      background: ${STATUS_COLORS.passed};
      transition: width 0.3s ease;
    }
    
    .test-suites {
      padding: 30px;
    }
    
    .suite {
      margin-bottom: 30px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
    }
    
    .suite-header {
      background: #f9fafb;
      padding: 15px 20px;
      border-bottom: 1px solid #e5e7eb;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .suite-header:hover {
      background: #f3f4f6;
    }
    
    .suite-name {
      font-weight: 600;
      font-size: 1.1em;
      color: #111827;
    }
    
    .suite-stats {
      display: flex;
      gap: 15px;
      font-size: 0.9em;
    }
    
    .suite-stat {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    
    .suite-stat .badge {
      padding: 2px 8px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 0.85em;
    }
    
    .badge.passed { background: #d1fae5; color: #065f46; }
    .badge.failed { background: #fee2e2; color: #991b1b; }
    .badge.total { background: #fee2e2; color: #991b1b; }
    
    .suite-body {
      display: none;
    }
    
    .suite.expanded .suite-body {
      display: block;
    }
    
    .test-case {
      padding: 15px 20px;
      border-bottom: 1px solid #f3f4f6;
    }
    
    .test-case:last-child {
      border-bottom: none;
    }
    
    .test-case.failed {
      background: #fef2f2;
    }
    
    .test-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 5px;
    }
    
    .test-name {
      font-weight: 500;
      color: #374151;
    }
    
    .test-status {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.85em;
      font-weight: 600;
    }
    
    .test-status.passed {
      background: #d1fae5;
      color: #065f46;
    }
    
    .test-status.failed {
      background: #fee2e2;
      color: #991b1b;
    }
    
    .test-meta {
      font-size: 0.85em;
      color: #6b7280;
    }
    
    .test-failure {
      margin-top: 10px;
      padding: 15px;
      background: #fef2f2;
      border-left: 4px solid ${STATUS_COLORS.failed};
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 0.85em;
      white-space: pre-wrap;
      word-break: break-word;
      color: #991b1b;
      max-height: 300px;
      overflow-y: auto;
    }
    
    .footer {
      background: #f9fafb;
      padding: 20px;
      text-align: center;
      color: #6b7280;
      font-size: 0.9em;
      border-top: 1px solid #e5e7eb;
    }
    
    .expand-icon {
      transition: transform 0.3s ease;
    }
    
    .suite.expanded .expand-icon {
      transform: rotate(180deg);
    }
    
    @media print {
      body {
        background: white;
        padding: 0;
      }
      
      .container {
        box-shadow: none;
      }
      
      .suite-header {
        cursor: default;
      }
      
      .suite-body {
        display: block !important;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Reporte de Pruebas Unitarias</h1>
      <p>Frontend - TuCreditoOnline | Generado: ${new Date().toLocaleString('es-MX')}</p>
    </div>
    
    <div class="stats">
      <div class="stat-card total">
        <h3>Total de Pruebas</h3>
        <div class="value">${stats.total}</div>
      </div>
      
      <div class="stat-card passed">
        <h3>✅ Exitosas</h3>
        <div class="value">${stats.passed}</div>
      </div>
      
      <div class="stat-card failed">
        <h3>❌ Fallidas</h3>
        <div class="value">${stats.failures}</div>
      </div>
      
      <div class="stat-card rate">
        <h3>Tasa de Éxito</h3>
        <div class="value">${passRate}%</div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${passRate}%"></div>
        </div>
      </div>
    </div>
    
    <div class="test-suites">
      <h2 style="margin-bottom: 20px; color: #111827;">Test Suites (${testSuites.length})</h2>
      ${testSuites.map((suite, index) => `
        <div class="suite ${index === 0 ? 'expanded' : ''}" id="suite-${index}">
          <div class="suite-header" onclick="toggleSuite(${index})">
            <div class="suite-name">${suite.name}</div>
            <div class="suite-stats">
              <div class="suite-stat">
                <span class="badge total">${suite.tests} tests</span>
              </div>
              <div class="suite-stat">
                <span class="badge passed">${suite.tests - suite.failures} ✓</span>
              </div>
              ${suite.failures > 0 ? `
                <div class="suite-stat">
                  <span class="badge failed">${suite.failures} ✗</span>
                </div>
              ` : ''}
              <span class="expand-icon">▼</span>
            </div>
          </div>
          
          <div class="suite-body">
            ${suite.testcases.map(testcase => `
              <div class="test-case ${testcase.status}">
                <div class="test-header">
                  <div class="test-name">${testcase.name}</div>
                  <span class="test-status ${testcase.status}">
                    ${testcase.status === 'passed' ? '✓ Passed' : '✗ Failed'}
                  </span>
                </div>
                <div class="test-meta">
                  ${testcase.classname} • ${(testcase.time * 1000).toFixed(0)}ms
                </div>
                ${testcase.failure ? `
                  <div class="test-failure">${escapeHtml(String(testcase.failure))}</div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}
    </div>
    
    <div class="footer">
      <p>Generado por Jest Test Reporter | TuCreditoOnline CI Pipeline</p>
      <p style="margin-top: 5px; font-size: 0.85em;">Duración total: ${stats.time.toFixed(2)}s</p>
    </div>
  </div>
  
  <script>
    function toggleSuite(index) {
      const suite = document.getElementById('suite-' + index);
      suite.classList.toggle('expanded');
    }
    
    // Expandir el primer suite por defecto
    document.addEventListener('DOMContentLoaded', function() {
      console.log('Test Report loaded - ${stats.total} tests, ${stats.passed} passed, ${stats.failures} failed');
    });
  </script>
</body>
</html>`;
}

/**
 * Genera el reporte Markdown simplificado (sin detalles de casos de prueba)
 */
function generateMarkdownReport(stats, testSuites) {
  const passRate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(2) : 0;
  
  let markdown = `## 📈 Resumen General

| Métrica | Valor |
|---------|-------|
| **Total de Pruebas** | ${stats.total} |
| **✅ Exitosas** | ${stats.passed} |
| **❌ Fallidas** | ${stats.failures} |
| **Tasa de Éxito** | ${passRate}% |
| **Duración Total** | ${stats.time.toFixed(2)}s |

## 📋 Test Suites (${testSuites.length})

`;

  testSuites.forEach((suite, index) => {
    const suitePassRate = suite.tests > 0 ? (((suite.tests - suite.failures) / suite.tests) * 100).toFixed(2) : 0;
    
    markdown += `### ${index + 1}. ${suite.name}

| Total | Exitosas | Fallidas | Tasa de Éxito | Duración |
|-------|----------|----------|---------------|----------|
| ${suite.tests} | ${suite.tests - suite.failures} | ${suite.failures} | ${suitePassRate}% | ${suite.time.toFixed(2)}s |

`;
  });

  markdown += `> 📦 Ver artifact **frontend-unit-test-results** para el reporte completo con detalles de cada test.\n`;
  
  return markdown;
}

/**
 * Escapa caracteres HTML
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Función principal
 */
async function main() {
  try {
    console.log('🚀 Generando reporte de pruebas unitarias...\n');
    
    // Verificar que existe el archivo junit.xml
    if (!fs.existsSync(JUNIT_XML_PATH)) {
      throw new Error(`No se encontró el archivo junit.xml en: ${JUNIT_XML_PATH}`);
    }
    
    // Parsear el XML
    console.log('📖 Leyendo junit.xml...');
    const parsedXml = await parseJunitXml();
    
    // Extraer estadísticas
    const stats = extractStats(parsedXml);
    console.log(`\n📊 Estadísticas:`);
    console.log(`   Total: ${stats.total}`);
    console.log(`   Exitosas: ${stats.passed}`);
    console.log(`   Fallidas: ${stats.failures}`);
    console.log(`   Errores: ${stats.errors}`);
    console.log(`   Duración: ${stats.time.toFixed(2)}s\n`);
    
    // Extraer test suites
    const testSuites = extractTestSuites(parsedXml);
    console.log(`📦 Test Suites encontrados: ${testSuites.length}\n`);
    
    // Generar reporte HTML
    console.log('🎨 Generando reporte HTML...');
    const htmlReport = generateHtmlReport(stats, testSuites);
    fs.writeFileSync(OUTPUT_HTML_PATH, htmlReport, 'utf-8');
    console.log(`✅ Reporte HTML generado: ${OUTPUT_HTML_PATH}\n`);
    
    // Generar reporte Markdown
    console.log('📝 Generando reporte Markdown...');
    const markdownReport = generateMarkdownReport(stats, testSuites);
    fs.writeFileSync(OUTPUT_MARKDOWN_PATH, markdownReport, 'utf-8');
    console.log(`✅ Reporte Markdown generado: ${OUTPUT_MARKDOWN_PATH}\n`);
    
    console.log('🎉 ¡Reportes generados exitosamente!\n');
    
    // Retornar código de salida basado en si hay tests fallidos
    process.exit(stats.failures > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('\n❌ Error al generar reporte:', error.message);
    process.exit(1);
  }
}

// Ejecutar
main();
