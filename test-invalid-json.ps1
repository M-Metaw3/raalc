# Test Invalid JSON Error Handling
# PowerShell script to test JSON parsing errors

$headers = @{
    'Content-Type' = 'application/json'
    'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJzdXBlcmFkbWluQHJhYWxjLmNvbSIsInVzZXJUeXBlIjoiQURNSU4iLCJyb2xlcyI6WyJTdXBlciBBZG1pbiJdLCJwZXJtaXNzaW9ucyI6WyJhZG1pbnMuYWN0aXZhdGUiLCJhZG1pbnMuY3JlYXRlIiwiYWRtaW5zLmRlYWN0aXZhdGUiLCJhZG1pbnMuZGVsZXRlIiwiYWRtaW5zLmxpc3QiLCJhZG1pbnMucmVhZCIsImFkbWlucy51cGRhdGUiLCJhZ2VudHMuYWN0aXZhdGUiLCJhZ2VudHMuYXBwcm92ZSIsImFnZW50cy5jcmVhdGUiLCJhZ2VudHMuZGVhY3RpdmF0ZSIsImFnZW50cy5kZWxldGUiLCJhZ2VudHMuZmVhdHVyZSIsImFnZW50cy5saXN0IiwiYWdlbnRzLnJlYWQiLCJhZ2VudHMucmVqZWN0IiwiYWdlbnRzLnVwZGF0ZSIsImF1ZGl0LmV4cG9ydCIsImF1ZGl0LnJlYWQiLCJhcHByb3ZlX2JyZWFrcyIsIm1hbmFnZV9icmVha3MiLCJyZWplY3RfYnJlYWtzIiwidmlld19icmVha3MiLCJjcmVhdGVfZGVwYXJ0bWVudHMiLCJkZWxldGVfZGVwYXJ0bWVudHMiLCJ1cGRhdGVfZGVwYXJ0bWVudHMiLCJ2aWV3X2RlcGFydG1lbnRzIiwiZG9jdW1lbnRzLmFwcHJvdmUiLCJkb2N1bWVudHMuZGVsZXRlIiwiZG9jdW1lbnRzLmxpc3QiLCJkb2N1bWVudHMucmVhZCIsImRvY3VtZW50cy5yZWplY3QiLCJwZXJtaXNzaW9ucy5jcmVhdGUiLCJwZXJtaXNzaW9ucy5kZWxldGUiLCJwZXJtaXNzaW9ucy5ncmFudCIsInBlcm1pc3Npb25zLmxpc3QiLCJwZXJtaXNzaW9ucy5yZWFkIiwicGVybWlzc2lvbnMucmV2b2tlIiwicGVybWlzc2lvbnMudXBkYXRlIiwicmVwb3J0cy5leHBvcnQiLCJyZXBvcnRzLnJlYWQiLCJ2aWV3X3JlcG9ydHMiLCJyb2xlcy5hc3NpZ24iLCJyb2xlcy5jcmVhdGUiLCJyb2xlcy5kZWxldGUiLCJyb2xlcy5saXN0Iiwicm9sZXMucmVhZCIsInJvbGVzLnJldm9rZSIsInJvbGVzLnVwZGF0ZSIsIm1hbmFnZV9zZXNzaW9ucyIsInZpZXdfc2Vzc2lvbnMiLCJzZXR0aW5ncy5yZWFkIiwic2V0dGluZ3MudXBkYXRlIiwiY3JlYXRlX3NoaWZ0cyIsImRlbGV0ZV9zaGlmdHMiLCJ1cGRhdGVfc2hpZnRzIiwidmlld19zaGlmdHMiLCJ1c2Vycy5hY3RpdmF0ZSIsInVzZXJzLmNyZWF0ZSIsInVzZXJzLmRlYWN0aXZhdGUiLCJ1c2Vycy5kZWxldGUiLCJ1c2Vycy5saXN0IiwidXNlcnMucmVhZCIsInVzZXJzLnVwZGF0ZSJdLCJpYXQiOjE3NjEzMzA2MzYsImV4cCI6MTc2MTQxNzAzNn0.X8N913w1N83Upsd4QPmKTurgrOo1S0x0NrLdYZThbxA'
}

# Test 1: Invalid JSON - Missing closing brace
Write-Host "`n=== Test 1: Missing Closing Brace ===" -ForegroundColor Cyan
$invalidBody1 = '{ "fullName": "Test", "email": "test@test.com"'

try {
    $response = Invoke-RestMethod -Uri 'http://localhost:4000/api/agents/create' `
        -Method Post `
        -Headers $headers `
        -Body $invalidBody1 `
        -ContentType 'application/json'
} catch {
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Yellow
    if ($_.ErrorDetails.Message) {
        $errorObj = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "Message: $($errorObj.message)" -ForegroundColor Yellow
        Write-Host "MessageKey: $($errorObj.messageKey)" -ForegroundColor Yellow
        if ($errorObj.detail) {
            Write-Host "Detail: $($errorObj.detail)" -ForegroundColor Gray
        }
    }
}

# Test 2: Invalid JSON - Extra comma
Write-Host "`n=== Test 2: Extra Comma ===" -ForegroundColor Cyan
$invalidBody2 = '{ "fullName": "Test", "email": "test@test.com", }'

try {
    $response = Invoke-RestMethod -Uri 'http://localhost:4000/api/agents/create' `
        -Method Post `
        -Headers $headers `
        -Body $invalidBody2 `
        -ContentType 'application/json'
} catch {
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Yellow
    if ($_.ErrorDetails.Message) {
        $errorObj = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "Message: $($errorObj.message)" -ForegroundColor Yellow
        Write-Host "MessageKey: $($errorObj.messageKey)" -ForegroundColor Yellow
        if ($errorObj.detail) {
            Write-Host "Detail: $($errorObj.detail)" -ForegroundColor Gray
        }
    }
}

# Test 3: Invalid JSON - Unquoted key
Write-Host "`n=== Test 3: Unquoted Key ===" -ForegroundColor Cyan
$invalidBody3 = '{ fullName: "Test", "email": "test@test.com" }'

try {
    $response = Invoke-RestMethod -Uri 'http://localhost:4000/api/agents/create' `
        -Method Post `
        -Headers $headers `
        -Body $invalidBody3 `
        -ContentType 'application/json'
} catch {
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Yellow
    if ($_.ErrorDetails.Message) {
        $errorObj = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "Message: $($errorObj.message)" -ForegroundColor Yellow
        Write-Host "MessageKey: $($errorObj.messageKey)" -ForegroundColor Yellow
        if ($errorObj.detail) {
            Write-Host "Detail: $($errorObj.detail)" -ForegroundColor Gray
        }
    }
}

# Test 4: Valid JSON (should work)
Write-Host "`n=== Test 4: Valid JSON ===" -ForegroundColor Cyan
$validBody = @{
    fullName = "Test Agent Valid"
    email = "valid_agent_$(Get-Date -Format 'yyyyMMddHHmmss')@test.com"
    phone = "0501234567"
    password = "Agent@123456"
    shiftId = 2
    departmentId = 5
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri 'http://localhost:4000/api/agents/create' `
        -Method Post `
        -Headers $headers `
        -Body $validBody `
        -ContentType 'application/json'
    
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host "Agent ID: $($response.data.agent.id)" -ForegroundColor Green
    Write-Host "Email: $($response.data.agent.email)" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Yellow
}

Write-Host "`n=== Tests Complete ===" -ForegroundColor Cyan




