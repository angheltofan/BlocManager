# BlockManager - Laborator 5: MVC
#
# Ruleaza din D:\BlocManager, in terminalul din VS Code:
#   .\laboratoare\laborator5\pasi_mvc.ps1
#
# Scriptul pregateste proiectul web-mvc, verifica tipurile, copiaza fisierele de predat
# in laboratoare\laborator5 si porneste aplicatia la http://localhost:3001/cupoane.
# Aplicatia se opreste cu Ctrl+C.

$ErrorActionPreference = "Continue"
[Console]::OutputEncoding = [Text.Encoding]::UTF8
$OutputEncoding = [Text.Encoding]::UTF8

$proiect = "D:\BlocManager"
$orm     = "$proiect\orm-codefirst"
$web     = "$orm\web-mvc"
$dest    = "$proiect\laboratoare\laborator5"

function Pas([string]$titlu, [scriptblock]$comanda) {
    Write-Host ""
    Write-Host "== $titlu" -ForegroundColor Cyan
    $global:LASTEXITCODE = 0
    & $comanda
    if ($LASTEXITCODE -ne 0) { throw "Pasul '$titlu' a esuat (cod de iesire $LASTEXITCODE)." }
}

# ---------------------------------------------------------------
# Sirul de conexiune (echivalentul connectionStrings din web.config):
# aceeasi baza de date ca la Laboratorul 4, blockmanager_codefirst
# ---------------------------------------------------------------
$envCodeFirst = "$orm\repository-codefirst\.env"
if (-not (Test-Path $envCodeFirst)) { throw "Lipseste $envCodeFirst. Ruleaza intai scriptul din Laboratorul 4." }
$linii = @(Get-Content $envCodeFirst | Where-Object { $_ -match '^(DATABASE_URL|INCARCARE_RELATII)=' }) + 'PORT=3001'
Set-Content -Path "$web\.env" -Value $linii -Encoding ascii -ErrorAction Stop
New-Item -ItemType Directory -Force $dest -ErrorAction Stop | Out-Null
Set-Location $orm

Pas "Ex. 1: instalarea pachetelor proiectului web-mvc (express, ejs)" { npm install }
Pas "Verificarea tipurilor in toata solutia (tsc)" { npm run typecheck }

# ---------------------------------------------------------------
# Fisierele de predat
# ---------------------------------------------------------------
$model      = "$dest\1_model"
$controller = "$dest\2_controller"
$accesor    = "$dest\3_accesor"
$views      = "$dest\4_views"
New-Item -ItemType Directory -Force $model, $controller, $accesor, "$views\cupoane", "$views\partials" -ErrorAction Stop | Out-Null
Copy-Item "$web\src\models\CuponViewModel.ts" $model -ErrorAction Stop
Copy-Item "$web\src\controllers\CupoaneController.ts", "$web\src\server.ts" $controller -ErrorAction Stop
Copy-Item "$orm\nivel-acces-date\src\CupoaneAccessor.ts", "$orm\nivel-acces-date\src\PlanuriAccessor.ts" $accesor -ErrorAction Stop
Copy-Item "$web\views\cupoane\*.ejs" "$views\cupoane" -ErrorAction Stop
Copy-Item "$web\views\partials\*.ejs" "$views\partials" -ErrorAction Stop
Copy-Item "$web\views\eroare.ejs", "$web\public\site.css" $views -ErrorAction Stop
Write-Host ""
Write-Host "Fisierele de predat sunt in $dest" -ForegroundColor Green
Get-ChildItem $dest -Recurse -File | Format-Table FullName, Length

# ---------------------------------------------------------------
# Ex. 1 si 2: testarea aplicatiei in browser
# ---------------------------------------------------------------
Write-Host ""
Write-Host "Deschide http://localhost:3001/cupoane si testeaza Index, Details, Create si Edit." -ForegroundColor Green
Write-Host "Opreste aplicatia cu Ctrl+C." -ForegroundColor Green
# browserul se deschide dupa cateva secunde, cand serverul asculta deja
Start-Job { Start-Sleep -Seconds 5; Start-Process "http://localhost:3001/cupoane" } | Out-Null
npm run web
