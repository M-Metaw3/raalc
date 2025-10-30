# Test Agent Create Endpoint
# PowerShell script with proper JSON handling

$headers = @{
    'Content-Type' = 'application/json'
    'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJzdXBlcmFkbWluQHJhYWxjLmNvbSIsInVzZXJUeXBlIjoiQURNSU4iLCJyb2xlcyI6WyJTdXBlciBBZG1pbiJdLCJwZXJtaXNzaW9ucyI6WyJhZG1pbnMuYWN0aXZhdGUiLCJhZG1pbnMuY3JlYXRlIiwiYWRtaW5zLmRlYWN0aXZhdGUiLCJhZG1pbnMuZGVsZXRlIiwiYWRtaW5zLmxpc3QiLCJhZG1pbnMucmVhZCIsImFkbWlucy51cGRhdGUiLCJhZ2VudHMuYWN0aXZhdGUiLCJhZ2VudHMuYXBwcm92ZSIsImFnZW50cy5jcmVhdGUiLCJhZ2VudHMuZGVhY3RpdmF0ZSIsImFnZW50cy5kZWxldGUiLCJhZ2VudHMuZmVhdHVyZSIsImFnZW50cy5saXN0IiwiYWdlbnRzLnJlYWQiLCJhZ2VudHMucmVqZWN0IiwiYWdlbnRzLnVwZGF0ZSIsImF1ZGl0LmV4cG9ydCIsImF1ZGl0LnJlYWQiLCJhcHByb3ZlX2JyZWFrcyIsIm1hbmFnZV9icmVha3MiLCJyZWplY3RfYnJlYWtzIiwidmlld19icmVha3MiLCJjcmVhdGVfZGVwYXJ0bWVudHMiLCJkZWxldGVfZGVwYXJ0bWVudHMiLCJ1cGRhdGVfZGVwYXJ0bWVudHMiLCJ2aWV3X2RlcGFydG1lbnRzIiwiZG9jdW1lbnRzLmFwcHJvdmUiLCJkb2N1bWVudHMuZGVsZXRlIiwiZG9jdW1lbnRzLmxpc3QiLCJkb2N1bWVudHMucmVhZCIsImRvY3VtZW50cy5yZWplY3QiLCJwZXJtaXNzaW9ucy5jcmVhdGUiLCJwZXJtaXNzaW9ucy5kZWxldGUiLCJwZXJtaXNzaW9ucy5ncmFudCIsInBlcm1pc3Npb25zLmxpc3QiLCJwZXJtaXNzaW9ucy5yZWFkIiwicGVybWlzc2lvbnMucmV2b2tlIiwicGVybWlzc2lvbnMudXBkYXRlIiwicmVwb3J0cy5leHBvcnQiLCJyZXBvcnRzLnJlYWQiLCJ2aWV3X3JlcG9ydHMiLCJyb2xlcy5hc3NpZ24iLCJyb2xlcy5jcmVhdGUiLCJyb2xlcy5kZWxldGUiLCJyb2xlcy5saXN0Iiwicm9sZXMucmVhZCIsInJvbGVzLnJldm9rZSIsInJvbGVzLnVwZGF0ZSIsIm1hbmFnZV9zZXNzaW9ucyIsInZpZXdfc2Vzc2lvbnMiLCJzZXR0aW5ncy5yZWFkIiwic2V0dGluZ3MudXBkYXRlIiwiY3JlYXRlX3NoaWZ0cyIsImRlbGV0ZV9zaGlmdHMiLCJ1cGRhdGVfc2hpZnRzIiwidmlld19zaGlmdHMiLCJ1c2Vycy5hY3RpdmF0ZSIsInVzZXJzLmNyZWF0ZSIsInVzZXJzLmRlYWN0aXZhdGUiLCJ1c2Vycy5kZWxldGUiLCJ1c2Vycy5saXN0IiwidXNlcnMucmVhZCIsInVzZXJzLnVwZGF0ZSJdLCJpYXQiOjE3NjEzMzA2MzYsImV4cCI6MTc2MTQxNzAzNn0.X8N913w1N83Upsd4QPmKTurgrOo1S0x0NrLdYZThbxA'
}

$body = @{
    fullName = "Admin Created Agent"
    email = "admin_agent_666@example.com"
    phone = "0509876543"
    password = "Agent@123456"
    shiftId = 2
    departmentId = 5
    licenseNumber = "LIC-ADMIN"
    agencyName = "Admin Agency"
} | ConvertTo-Json

Write-Host "Sending request..." -ForegroundColor Cyan
Write-Host "Body: $body" -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri 'http://localhost:4000/api/agents/create' `
        -Method Post `
        -Headers $headers `
        -Body $body `
        -ContentType 'application/json'
    
    Write-Host "`n✅ Success!" -ForegroundColor Green
    Write-Host "`nResponse:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "`n❌ Error!" -ForegroundColor Red
    Write-Host "`nStatus Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Yellow
    Write-Host "Message: $($_.Exception.Message)" -ForegroundColor Yellow
    
    if ($_.ErrorDetails.Message) {
        Write-Host "`nError Details:" -ForegroundColor Yellow
        $_.ErrorDetails.Message
    }
}




