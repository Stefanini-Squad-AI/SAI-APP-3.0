#!/bin/bash
set -euo pipefail

# Make sure the script receives the required arguments
if [ $# -lt 3 ]; then
  echo "================================================"
  echo "  K6 Performance Testing Framework"
  echo "================================================"
  echo ""
  echo "Usage: ./run_test.sh <TEST_NAME> <TEST_TYPE> <REPORT_MODE>"
  echo ""
  echo "Parameters:"
  echo "  TEST_NAME    : Test name (e.g., demo_ticketlog)"
  echo "  TEST_TYPE    : PERFORMANCE | LOAD | STRESS"
  echo "  REPORT_MODE  : TRADITIONAL | REALTIME"
  echo ""
  echo "Examples:"
  echo "  ./run_test.sh demo_ticketlog PERFORMANCE TRADITIONAL"
  echo "  ./run_test.sh demo_ticketlog LOAD REALTIME"
  echo "  ./run_test.sh demo_ticketlog STRESS TRADITIONAL"
  echo ""
  exit 1
fi

testName="$1"
testType=$(echo "$2" | tr '[:lower:]' '[:upper:]')
reportMode=$(echo "$3" | tr '[:lower:]' '[:upper:]')

# Validate test type
if [[ "$testType" != "PERFORMANCE" && "$testType" != "LOAD" && "$testType" != "STRESS" ]]; then
  echo "❌ Error: Invalid test type. Use: PERFORMANCE, LOAD or STRESS"
  exit 1
fi

# Validate report mode
if [[ "$reportMode" != "TRADITIONAL" && "$reportMode" != "REALTIME" ]]; then
  echo "❌ Error: Invalid report mode. Use: TRADITIONAL or REALTIME"
  exit 1
fi

echo "================================================"
echo "  🚀 Starting $testType Test"
echo "================================================"
echo "Test: $testName"
echo "Type: $testType"
echo "Mode: $reportMode"
echo "================================================"
echo ""

# Get current date for folder creation
currentDate=$(date +"%Y-%m-%d")

reportsBaseDir="reports/$currentDate"

# Create base reports directory if it doesn't exist
mkdir -p "$reportsBaseDir"

# Find next available version number
nextVersion=1
while [ -d "$reportsBaseDir/${testName}_v$nextVersion" ]; do
  nextVersion=$((nextVersion + 1))
done

# Both JSON and HTML reports will be in the same versioned folder
reportResultDir="$reportsBaseDir/${testName}_v$nextVersion"
resultDir="$reportResultDir"

# Create the directory
mkdir -p "$reportResultDir"

echo "📁 Results directory: $reportResultDir"
echo ""

# Run the k6 test script with environment variables
# K6_INSECURE_SKIP_TLS_VERIFY evita errores de certificado al cargar módulos externos (jslib.k6.io)
if [ "$reportMode" == "REALTIME" ]; then
  echo "📊 Running with Web Dashboard (REALTIME Mode)..."
  K6_INSECURE_SKIP_TLS_VERIFY=true K6_WEB_DASHBOARD=true K6_WEB_DASHBOARD_EXPORT="$reportResultDir/realtime-report.html" \
    k6 run "scripts/test-$testName.js" \
    --out "json=$reportResultDir/$testType-$testName.json" \
    -e TEST_NAME="$testName" \
    -e RESULT_DIR="$reportResultDir" \
    -e REPORT_RESULT_DIR="$reportResultDir" \
    -e TEST_TYPE="$testType" \
    -e REPORT_MODE="$reportMode"
else
  echo "📝 Running with Custom Report (TRADITIONAL Mode)..."
  K6_INSECURE_SKIP_TLS_VERIFY=true k6 run "scripts/test-$testName.js" \
    --out "json=$reportResultDir/$testType-$testName.json" \
    -e TEST_NAME="$testName" \
    -e RESULT_DIR="$reportResultDir" \
    -e REPORT_RESULT_DIR="$reportResultDir" \
    -e TEST_TYPE="$testType" \
    -e REPORT_MODE="$reportMode"
fi

echo ""
echo "================================================"
echo "  ✅ Test completed"
echo "================================================"
echo "📁 Results directory: $reportResultDir"
echo "  - HTML Report: $reportResultDir/$testType-test-*-$testName.html"
echo "  - JSON Results: $reportResultDir/$testType-$testName.json"
echo "================================================"
