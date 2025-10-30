#!/bin/bash

###############################################################################
# RAALC Admin API - Postman Collection Test Script
# 
# Run Postman collection from command line using Newman
# 
# Usage:
#   ./scripts/test-admin-postman.sh
#   
# Requirements:
#   - Newman installed: npm install -g newman
#   - Server running on port 4000
###############################################################################

echo "🚀 RAALC Admin API - Postman Collection Test"
echo "============================================"
echo ""

# Check if Newman is installed
if ! command -v newman &> /dev/null; then
    echo "❌ Newman is not installed!"
    echo ""
    echo "Install Newman:"
    echo "  npm install -g newman"
    echo "  npm install -g newman-reporter-htmlextra"
    echo ""
    exit 1
fi

# Check if server is running
echo "🔍 Checking if server is running..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/health | grep -q "200"; then
    echo "✅ Server is running!"
else
    echo "❌ Server is not running!"
    echo ""
    echo "Start the server first:"
    echo "  npm run dev"
    echo ""
    exit 1
fi

echo ""
echo "🧪 Running Postman Collection..."
echo ""

# Run Newman with HTML report
newman run postman/Admin-Flow-Collection.json \
  -e postman/RAALC-Environment.postman_environment.json \
  --reporters cli,htmlextra \
  --reporter-htmlextra-export reports/admin-api-test-report.html \
  --reporter-htmlextra-title "RAALC Admin API Test Report" \
  --reporter-htmlextra-logs \
  --reporter-htmlextra-showEnvironmentData \
  --color on \
  --delay-request 100 \
  --timeout-request 10000

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo "============================================"
    echo "✅ All tests passed!"
    echo "============================================"
    echo ""
    echo "📊 HTML Report: reports/admin-api-test-report.html"
    echo ""
    exit 0
else
    echo ""
    echo "============================================"
    echo "❌ Some tests failed!"
    echo "============================================"
    echo ""
    echo "📊 Check HTML Report: reports/admin-api-test-report.html"
    echo ""
    exit 1
fi

