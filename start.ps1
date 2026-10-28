Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "     QUICKPOS - RETAIL BILLING & INVENTORY SYSTEM" -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "Starting POS server on http://localhost:3005 ..." -ForegroundColor Yellow
$env:PORT = "3005"
Start-Process "http://localhost:3005"
node server.js
