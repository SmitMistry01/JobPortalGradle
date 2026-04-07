# Start Auth Service with SMTP credentials from args or environment
# Run this in PowerShell

param(
    [string]$username = $env:SPRING_MAIL_USERNAME,
    [string]$password = $env:SPRING_MAIL_PASSWORD
)

if ([string]::IsNullOrWhiteSpace($username) -or [string]::IsNullOrWhiteSpace($password)) {
    Write-Host "Missing SMTP credentials." -ForegroundColor Red
    Write-Host "Provide -username/-password or set SPRING_MAIL_USERNAME and SPRING_MAIL_PASSWORD." -ForegroundColor Yellow
    exit 1
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting Auth Service with Mail Config" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host ""
Write-Host "Setting environment variables..." -ForegroundColor Yellow
$env:MAIL_USERNAME = $username
$env:MAIL_PASSWORD = $password
$env:SPRING_MAIL_USERNAME = $username
$env:SPRING_MAIL_PASSWORD = $password

Write-Host "✓ SPRING_MAIL_USERNAME = $username" -ForegroundColor Green
Write-Host "✓ SPRING_MAIL_PASSWORD = (set)" -ForegroundColor Green

Write-Host ""
Write-Host "Verifying environment variables..." -ForegroundColor Yellow
Write-Host "SPRING_MAIL_USERNAME = $($env:SPRING_MAIL_USERNAME)" -ForegroundColor Cyan
Write-Host "SPRING_MAIL_PASSWORD = $($env:SPRING_MAIL_PASSWORD -replace '.', '*')" -ForegroundColor Cyan

Write-Host ""
Write-Host "Starting Auth Service with Gradle..." -ForegroundColor Yellow
Write-Host "Look for: '========== Mail Configuration ==========' in logs" -ForegroundColor Gray
Write-Host ""

# Start the service
Set-Location "C:\Users\smitm\Downloads\jobsportalgradle"
.\gradlew :services:auth-service:bootRun

