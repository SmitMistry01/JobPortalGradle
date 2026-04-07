$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$logDir = Join-Path $root "logs"
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir | Out-Null
}

# Check if Cloudinary environment variables are set
$cloudinaryConfigured = -not [string]::IsNullOrWhiteSpace($env:CLOUDINARY_CLOUD_NAME) `
    -and -not [string]::IsNullOrWhiteSpace($env:CLOUDINARY_API_KEY) `
    -and -not [string]::IsNullOrWhiteSpace($env:CLOUDINARY_API_SECRET)

if ($cloudinaryConfigured) {
    Write-Host "✓ Cloudinary is configured" -ForegroundColor Green
} else {
    Write-Host "⚠ WARNING: Cloudinary environment variables are not set!" -ForegroundColor Yellow
    Write-Host "  Profile image uploads and resume uploads will fail." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  To fix, set these environment variables before starting services:" -ForegroundColor Yellow
    Write-Host "  `$env:CLOUDINARY_CLOUD_NAME = 'your-cloud-name'" -ForegroundColor Yellow
    Write-Host "  `$env:CLOUDINARY_API_KEY = 'your-api-key'" -ForegroundColor Yellow
    Write-Host "  `$env:CLOUDINARY_API_SECRET = 'your-api-secret'" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  See CLOUDINARY_AND_REGISTRATION_FIX.md for details" -ForegroundColor Yellow
    Write-Host ""
}

$modules = @(
    "config-server",
    "discovery-server",
    "auth-service",
    "job-service",
    "application-service",
    "admin-service",
    "notification-service",
    "api-gateway"
)

Get-Process java, gradle -ErrorAction SilentlyContinue | Stop-Process -Force

foreach ($module in $modules) {
    $command = @"
`$env:JAVA_TOOL_OPTIONS='-Deureka.instance.prefer-ip-address=true -Deureka.instance.ip-address=127.0.0.1 -Deureka.instance.hostname=localhost'
`$env:CLOUDINARY_CLOUD_NAME='$($env:CLOUDINARY_CLOUD_NAME)'
`$env:CLOUDINARY_API_KEY='$($env:CLOUDINARY_API_KEY)'
`$env:CLOUDINARY_API_SECRET='$($env:CLOUDINARY_API_SECRET)'
Set-Location '$root'
.\gradlew :services:$module:bootRun
"@

    Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", $command
    Start-Sleep -Seconds 3
}

Write-Host "Started all services in separate PowerShell windows."
Write-Host "Eureka dashboard: http://localhost:8761"
Write-Host "Gateway URL: http://localhost:8080"
