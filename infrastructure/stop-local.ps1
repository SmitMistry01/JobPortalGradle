Get-Process java, gradle -ErrorAction SilentlyContinue | Stop-Process -Force
Write-Host "Stopped all Java/Gradle processes."
