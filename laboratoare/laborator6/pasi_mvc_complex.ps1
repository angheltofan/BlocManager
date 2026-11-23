# BlockManager - Laborator 6: MVC complex (entitatea Abonament, cu chei straine)
#
# Ruleaza din D:\BlocManager, in terminalul din VS Code:
#   .\laboratoare\laborator6\pasi_mvc_complex.ps1
#
# Scriptul aplica migrarea cu asociatiile de test, verifica tipurile, copiaza fisierele de predat
# in laboratoare\laborator6 si porneste aplicatia la http://localhost:3001/abonamente.
# Aplicatia se opreste cu Ctrl+C.

$ErrorActionPreference = "Continue"
[Console]::OutputEncoding = [Text.Encoding]::UTF8
$OutputEncoding = [Text.Encoding]::UTF8

$proiect = "D:\BlocManager"
$orm     = "$proiect\orm-codefirst"
$web     = "$orm\web-mvc"
$dest    = "$proiect\laboratoare\laborator6"

function Pas([string]$titlu, [scriptblock]$comanda) {
    Write-Host ""
    Write-Host "== $titlu" -ForegroundColor Cyan
    $global:LASTEXITCODE = 0
    & $comanda
    if ($LASTEXITCODE -ne 0) { throw "Pasul '$titlu' a esuat (cod de iesire $LASTEXITCODE)." }
}

if (-not (Test-Path "$orm\repository-codefirst\.env")) { throw "Lipseste .env din repository-codefirst. Ruleaza intai scriptul din Laboratorul 4." }
if (-not (Test-Path "$web\.env")) { throw "Lipseste .env din web-mvc. Ruleaza intai scriptul din Laboratorul 5." }
New-Item -ItemType Directory -Force $dest -ErrorAction Stop | Out-Null
Set-Location $orm

Pas "Instalarea pachetelor (npm install)" { npm install }
Pas "Migrarea date_asociatii_abonamente: asociatii si abonamente de test (prisma migrate dev)" { npm run migrate:dev }
Pas "Starea migrarilor (prisma migrate status)" { npm run migrate:status }
Pas "Verificarea tipurilor in toata solutia (tsc)" { npm run typecheck }

# ---------------------------------------------------------------
# Fisierele de predat
# ---------------------------------------------------------------
$model      = "$dest\1_model"
$controller = "$dest\2_controller"
$views      = "$dest\3_views"
$extra      = "$dest\4_accesor_si_migrare"
New-Item -ItemType Directory -Force $model, $controller, "$views\abonamente", "$views\partials", $extra -ErrorAction Stop | Out-Null
Copy-Item "$web\src\models\AbonamentViewModel.ts" $model -ErrorAction Stop
Copy-Item "$web\src\controllers\AbonamenteController.ts", "$web\src\server.ts" $controller -ErrorAction Stop
Copy-Item "$web\views\abonamente\*.ejs" "$views\abonamente" -ErrorAction Stop
Copy-Item "$web\views\partials\inceput.ejs", "$web\views\partials\sfarsit.ejs" "$views\partials" -ErrorAction Stop
Copy-Item "$web\public\site.css" $views -ErrorAction Stop
Copy-Item "$orm\nivel-acces-date\src\AbonamenteAccessor.ts" $extra -ErrorAction Stop
Copy-Item "$orm\repository-codefirst\prisma\migrations\20261111120000_date_asociatii_abonamente\migration.sql" "$extra\date_asociatii_abonamente.sql" -ErrorAction Stop
Write-Host ""
Write-Host "Fisierele de predat sunt in $dest" -ForegroundColor Green
Get-ChildItem $dest -Recurse -File | Format-Table FullName, Length

# ---------------------------------------------------------------
# Testarea aplicatiei in browser
# ---------------------------------------------------------------
Write-Host ""
Write-Host "Deschide http://localhost:3001/abonamente si testeaza Index si Create." -ForegroundColor Green
Write-Host "Opreste aplicatia cu Ctrl+C." -ForegroundColor Green
Start-Job { Start-Sleep -Seconds 5; Start-Process "http://localhost:3001/abonamente" } | Out-Null
npm run web
