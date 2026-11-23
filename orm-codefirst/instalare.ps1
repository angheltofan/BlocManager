# BlockManager - instalarea aplicatiei (o singura data, sau dupa o actualizare)
#
# Ruleaza din folderul orm-codefirst, in PowerShell:
#   .\instalare.ps1
#
# Ce face: scrie fisierele .env, instaleaza pachetele, creeaza baza de date blockmanager_codefirst
# (daca lipseste), aplica migrarile, adauga datele de test si verifica tipurile.
# Dupa instalare, aplicatia porneste cu .\porneste.ps1

param([string]$Parola)

$ErrorActionPreference = "Continue"
[Console]::OutputEncoding = [Text.Encoding]::UTF8
$OutputEncoding = [Text.Encoding]::UTF8
$app  = $PSScriptRoot
$baza = "blockmanager_codefirst"

function Pas([string]$titlu, [scriptblock]$comanda) {
    Write-Host ""
    Write-Host "== $titlu" -ForegroundColor Cyan
    $global:LASTEXITCODE = 0
    & $comanda
    if ($LASTEXITCODE -ne 0) { throw "Pasul '$titlu' a esuat (cod de iesire $LASTEXITCODE)." }
}

# PostgreSQL: cea mai noua versiune instalata in C:\Program Files\PostgreSQL
$pg = Get-ChildItem "C:\Program Files\PostgreSQL" -Directory -ErrorAction SilentlyContinue | Sort-Object { [int]($_.Name -replace '\D', '') } -Descending | Select-Object -First 1
if ($pg) { $env:Path = "$($pg.FullName)\bin;$env:Path" }
if (-not (Get-Command psql -ErrorAction SilentlyContinue)) { throw "Nu gasesc PostgreSQL (psql). Instaleaza PostgreSQL 16 sau mai nou." }
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw "Nu gasesc Node.js. Instaleaza Node.js 22 LTS." }
$versiuneNode = [version]((node -v).TrimStart('v'))
if ($versiuneNode -lt [version]"20.19.0") { throw "Node.js $versiuneNode este prea vechi; este nevoie de cel putin 20.19 (recomandat 22 LTS)." }

# Sirul de conexiune: din instalarea anterioara, din .env-ul proiectului principal sau din parola data
$linie = $null
if (Test-Path "$app\repository-codefirst\.env") {
    $linie = Get-Content "$app\repository-codefirst\.env" | Where-Object { $_ -match '^DATABASE_URL=' } | Select-Object -First 1
}
if (-not $linie -and (Test-Path "$app\..\.env")) {
    $radacina = Get-Content "$app\..\.env" | Where-Object { $_ -match '^DATABASE_URL=' } | Select-Object -First 1
    if ($radacina) { $linie = $radacina -replace '/[^/?"]+(\?|")', "/$baza`$1" }
}
if (-not $linie) {
    if (-not $Parola) { $Parola = Read-Host "Parola utilizatorului postgres" }
    $linie = "DATABASE_URL=`"postgresql://postgres:$([Uri]::EscapeDataString($Parola))@localhost:5432/$baza`?schema=public`""
}
if ($linie -match 'postgresql://[^:]+:([^@]+)@') { $env:PGPASSWORD = [Uri]::UnescapeDataString($Matches[1]) }

$comun = @($linie, 'INCARCARE_RELATII="eager"')
Set-Content "$app\repository-codefirst\.env" -Value $comun -Encoding ascii
Set-Content "$app\test-console-codefirst\.env" -Value $comun -Encoding ascii
Set-Content "$app\web-mvc\.env" -Value ($comun + 'PORT=3001', 'ADRESA_UTILIZATOR="http://localhost:3002"') -Encoding ascii
Set-Content "$app\web-api\.env" -Value ($comun + 'PORT=3002') -Encoding ascii
Write-Host "Fisierele .env sunt scrise (baza de date: $baza)." -ForegroundColor Green
Set-Location $app

Pas "Instalarea pachetelor (npm install)" { npm install }

$exista = psql -h localhost -U postgres -d postgres -At -c "SELECT count(*) FROM pg_database WHERE datname = '$baza'"
if ($LASTEXITCODE -ne 0) { throw "Nu m-am putut conecta la PostgreSQL. Verifica parola din repository-codefirst\.env." }
if ("$exista".Trim() -eq "0") { Pas "Crearea bazei de date $baza" { createdb -h localhost -U postgres $baza } }

Pas "Aplicarea migrarilor (prisma migrate deploy)" { npm run migrate:deploy }
Pas "Datele de test: planurile si cupoanele (prisma db seed)" { npm run db:seed }
Pas "Verificarea tipurilor (tsc)" { npm run typecheck }

Write-Host ""
Write-Host "Instalarea s-a terminat. Porneste aplicatia cu: .\porneste.ps1" -ForegroundColor Green
