$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

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
Set-Location '$root'
.\gradlew :services:$module:bootRun
"@

    Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", $command
    Start-Sleep -Seconds 3
}

Write-Host "Started all services in separate PowerShell windows."
Write-Host "Eureka dashboard: http://localhost:8761"
Write-Host "Gateway URL: http://localhost:8080"
