# BlockManager - Laborator 7: API
#
# Ruleaza din D:\BlocManager, in terminalul din VS Code:
#   .\laboratoare\laborator7\pasi_api.ps1
#
# Scriptul pregateste proiectul web-api, verifica tipurile, copiaza fisierele de predat
# in laboratoare\laborator7 si porneste API-ul la http://localhost:3002/api/cupoane.
# Cat timp API-ul ruleaza, testele se fac din Postman (colectia BlockManager_API.postman_collection.json)
# sau, intr-un al doilea terminal, cu .\laboratoare\laborator7\teste_api.ps1. API-ul se opreste cu Ctrl+C.

$ErrorActionPreference = "Continue"
[Console]::OutputEncoding = [Text.Encoding]::UTF8
$OutputEncoding = [Text.Encoding]::UTF8

$proiect = "D:\BlocManager"
$orm     = "$proiect\orm-codefirst"
$api     = "$orm\web-api"
$dest    = "$proiect\laboratoare\laborator7"

function Pas([string]$titlu, [scriptblock]$comanda) {
    Write-Host ""
    Write-Host "== $titlu" -ForegroundColor Cyan
    $global:LASTEXITCODE = 0
    & $comanda
    if ($LASTEXITCODE -ne 0) { throw "Pasul '$titlu' a esuat (cod de iesire $LASTEXITCODE)." }
}

# Sirul de conectare (echivalentul connectionStrings din web.config): aceeasi baza de date ca la Laboratorul 4
$envCodeFirst = "$orm\repository-codefirst\.env"
if (-not (Test-Path $envCodeFirst)) { throw "Lipseste $envCodeFirst. Ruleaza intai scriptul din Laboratorul 4." }
$linii = @(Get-Content $envCodeFirst | Where-Object { $_ -match '^(DATABASE_URL|INCARCARE_RELATII)=' }) + 'PORT=3002'
Set-Content -Path "$api\.env" -Value $linii -Encoding ascii -ErrorAction Stop
New-Item -ItemType Directory -Force $dest -ErrorAction Stop | Out-Null
Set-Location $orm

Pas "Ex. 1: instalarea pachetelor proiectului web-api (express, @automapper/core, @automapper/pojos)" { npm install }
Pas "Verificarea tipurilor in toata solutia (tsc)" { npm run typecheck }

# ---------------------------------------------------------------
# Fisierele de predat
# ---------------------------------------------------------------
$controller = "$dest\1_controller"
$modele     = "$dest\2_modele_api"
$mapper     = "$dest\3_mapper"
$postman    = "$dest\4_postman"
New-Item -ItemType Directory -Force $controller, $modele, $mapper, $postman -ErrorAction Stop | Out-Null
Copy-Item "$api\src\controllers\CupoaneController.ts", "$api\src\server.ts" $controller -ErrorAction Stop
Copy-Item "$api\src\dtos\CuponDto.ts", "$api\src\dtos\CuponInputDto.ts" $modele -ErrorAction Stop
Copy-Item "$api\src\mapare\mapper.ts" $mapper -ErrorAction Stop
Copy-Item "$api\BlockManager_API.postman_collection.json" $postman -ErrorAction Stop
Write-Host ""
Write-Host "Fisierele de predat sunt in $dest" -ForegroundColor Green
Get-ChildItem $dest -Recurse -File | Format-Table FullName, Length

# ---------------------------------------------------------------
# Ex. 1-3: API-ul pornit, pentru testele din Postman
# ---------------------------------------------------------------
Write-Host ""
Write-Host "API-ul porneste la http://localhost:3002/api/cupoane" -ForegroundColor Green
Write-Host "In Postman: Import -> $postman\BlockManager_API.postman_collection.json -> Run collection." -ForegroundColor Green
Write-Host "Sau, intr-un al doilea terminal: .\laboratoare\laborator7\teste_api.ps1" -ForegroundColor Green
Write-Host "Opreste API-ul cu Ctrl+C." -ForegroundColor Green
npm run api
