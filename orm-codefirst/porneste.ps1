# BlockManager - pornirea aplicatiei
#
# Ruleaza din folderul orm-codefirst, in PowerShell:
#   .\porneste.ps1
#
# Porneste sectiunea de administrare (http://localhost:3001) intr-o fereastra separata si
# sectiunea de utilizator + API-ul (http://localhost:3002) in fereastra curenta, apoi deschide browserul.
# Fiecare se opreste cu Ctrl+C in fereastra lui.

$app = $PSScriptRoot
[Console]::OutputEncoding = [Text.Encoding]::UTF8
if (-not (Test-Path "$app\web-api\.env")) { throw "Aplicatia nu este instalata. Ruleaza intai .\instalare.ps1" }

Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$app'; [Console]::OutputEncoding = [Text.Encoding]::UTF8; npm run admin"
Start-Job { Start-Sleep -Seconds 7; Start-Process "http://localhost:3002/"; Start-Process "http://localhost:3001/abonamente" } | Out-Null

Write-Host "Sectiunea de utilizator: http://localhost:3002/" -ForegroundColor Green
Write-Host "Sectiunea de administrare: http://localhost:3001/abonamente (fereastra separata)" -ForegroundColor Green
Write-Host "Logurile: $app\logs" -ForegroundColor Green
Set-Location $app
npm run api
