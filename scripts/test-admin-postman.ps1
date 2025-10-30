###############################################################################
# RAALC Admin API - Postman Collection Test Script (PowerShell)
# 
# Run Postman collection from command line using Newman
# 
# Usage:
#   .\scripts\test-admin-postman.ps1
#   
# Requirements:
#   - Newman installed: npm install -g newman
#   - Server running on port 4000
###############################################################################

Write-Host "🚀 RAALC Admin API - Postman Collection Test" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check if Newman is installed
$newmanInstalled = Get-Command newman -ErrorAction SilentlyContinue
if (-not $newmanInstalled) {
    Write-Host "❌ Newman is not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Install Newman:" -ForegroundColor Yellow
    Write-Host "  npm install -g newman" -ForegroundColor Yellow
    Write-Host "  npm install -g newman-reporter-htmlextra" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Check if server is running
Write-Host "🔍 Checking if server is running..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:4000/health" -UseBasicParsing -TimeoutSec 3
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Server is running!" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Server is not running!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Start the server first:" -ForegroundColor Yellow
    Write-Host "  npm run dev" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "🧪 Running Postman Collection..." -ForegroundColor Cyan
Write-Host ""

# Create reports directory if not exists
if (-not (Test-Path "reports")) {
    New-Item -ItemType Directory -Path "reports" | Out-Null
}

# Run Newman with HTML report
newman run postman/Admin-Flow-Collection.json `
  -e postman/RAALC-Environment.postman_environment.json `
  --reporters cli,htmlextra `
  --reporter-htmlextra-export reports/admin-api-test-report.html `
  --reporter-htmlextra-title "RAALC Admin API Test Report" `
  --reporter-htmlextra-logs `
  --reporter-htmlextra-showEnvironmentData `
  --color on `
  --delay-request 100 `
  --timeout-request 10000

# Check exit code
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "✅ All tests passed!" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 HTML Report: reports/admin-api-test-report.html" -ForegroundColor Cyan
    Write-Host ""
    
    # Try to open report in browser
    $reportPath = Resolve-Path "reports/admin-api-test-report.html"
    Write-Host "Opening report in browser..." -ForegroundColor Cyan
    Start-Process $reportPath
    
    exit 0
} else {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Red
    Write-Host "❌ Some tests failed!" -ForegroundColor Red
    Write-Host "============================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "📊 Check HTML Report: reports/admin-api-test-report.html" -ForegroundColor Yellow
    Write-Host ""
    
    # Try to open report in browser
    $reportPath = Resolve-Path "reports/admin-api-test-report.html" -ErrorAction SilentlyContinue
    if ($reportPath) {
        Write-Host "Opening report in browser..." -ForegroundColor Cyan
        Start-Process $reportPath
    }
    
    exit 1
}

