# Start Auth Service with Gmail Credentials
# Run this in PowerShell

param(
    [string]$username = "jobportall121@gmail.com",
    [string]$password = "tyrwqxhcmvwaxjjq"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting Auth Service with Mail Config" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host ""
Write-Host "Setting environment variables..." -ForegroundColor Yellow
$env:MAIL_USERNAME = $username
$env:MAIL_PASSWORD = $password
$env:SPRING_MAIL_USERNAME = $username
$env:SPRING_MAIL_PASSWORD = $password

Write-Host "✓ MAIL_USERNAME = $username" -ForegroundColor Green
Write-Host "✓ MAIL_PASSWORD = (set)" -ForegroundColor Green

Write-Host ""
Write-Host "Verifying environment variables..." -ForegroundColor Yellow
Write-Host "MAIL_USERNAME = $($env:MAIL_USERNAME)" -ForegroundColor Cyan
Write-Host "MAIL_PASSWORD = $($env:MAIL_PASSWORD -replace '.', '*')" -ForegroundColor Cyan

Write-Host ""
Write-Host "Starting Auth Service with Gradle..." -ForegroundColor Yellow
Write-Host "Look for: '========== Mail Configuration ==========' in logs" -ForegroundColor Gray
Write-Host ""

# Start the service
Set-Location "C:\Users\smitm\Downloads\jobsportalgradle"
.\gradlew :services:auth-service:bootRun

