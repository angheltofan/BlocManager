# BlockManager - Laborator 4: ORM Code First
#
# Ruleaza din D:\BlocManager, in terminalul din VS Code:
#   .\laboratoare\laborator4\pasi_codefirst.ps1
#
# Scriptul executa, in ordine, pasii descrisi in BlockManager_Pasi_Code_First.pdf
# si copiaza fisierele de predat in laboratoare\laborator4.
# Poate fi rulat de mai multe ori: migrarile deja aplicate sunt sarite, iar seed-ul nu creeaza duplicate.

# Comenzile scriu mesaje informative pe stderr; erorile reale sunt prinse prin codul de iesire, in functia Pas.
$ErrorActionPreference = "Continue"
[Console]::OutputEncoding = [Text.Encoding]::UTF8
$OutputEncoding = [Text.Encoding]::UTF8
$env:PGCLIENTENCODING = "UTF8"

$proiect = "D:\BlocManager"
$orm     = "$proiect\orm-codefirst"
$dest    = "$proiect\laboratoare\laborator4"
$baza    = "blockmanager_codefirst"
$pgBin   = "C:\Program Files\PostgreSQL\18\bin"
$env:Path = "$pgBin;$env:Path"

function Pas([string]$titlu, [scriptblock]$comanda) {
    Write-Host ""
    Write-Host "== $titlu" -ForegroundColor Cyan
    $global:LASTEXITCODE = 0
    & $comanda
    if ($LASTEXITCODE -ne 0) { throw "Pasul '$titlu' a esuat (cod de iesire $LASTEXITCODE)." }
}

# ---------------------------------------------------------------
# Pregatire: sirul de conexiune catre baza de date NOUA (Code First)
# ---------------------------------------------------------------
$linie = Get-Content "$proiect\.env" -ErrorAction Stop | Where-Object { $_ -match '^DATABASE_URL=' } | Select-Object -First 1
if (-not $linie) { throw "Nu am gasit DATABASE_URL in $proiect\.env" }
# acelasi server si utilizator ca aplicatia web, alta baza de date
$linieCodeFirst = $linie -replace '/[^/?"]+(\?|")', "/$baza`$1"
$continut = @($linieCodeFirst, 'INCARCARE_RELATII="eager"')
Set-Content -Path "$orm\repository-codefirst\.env" -Value $continut -Encoding ascii -ErrorAction Stop
Set-Content -Path "$orm\test-console-codefirst\.env" -Value $continut -Encoding ascii -ErrorAction Stop
Write-Host "Sirul de conexiune: $($linieCodeFirst -replace ':[^:@/]+@', ':****@')"
if (-not $env:PGPASSWORD -and $linie -match 'postgresql://[^:]+:([^@]+)@') {
    $env:PGPASSWORD = [Uri]::UnescapeDataString($Matches[1])
}
New-Item -ItemType Directory -Force $dest -ErrorAction Stop | Out-Null
Set-Location $orm

# ---------------------------------------------------------------
# Exercitiul 1: solutia, proiectele si pachetele
# ---------------------------------------------------------------
Pas "Ex. 1: instalarea pachetelor si generarea clientului din modele (npm install)" { npm install }

# ---------------------------------------------------------------
# Exercitiile 2, 3 si 5: baza de date noua, creata din migrari
# ---------------------------------------------------------------
$exista = psql -h localhost -U postgres -d postgres -At -c "SELECT count(*) FROM pg_database WHERE datname = '$baza'"
if ($LASTEXITCODE -ne 0) { throw "Nu m-am putut conecta la PostgreSQL." }
if ("$exista".Trim() -eq "0") {
    Pas "Ex. 2: crearea bazei de date goale $baza" { createdb -h localhost -U postgres $baza }
} else { Write-Host "`n== Ex. 2: baza de date $baza exista deja, trec mai departe" -ForegroundColor Yellow }

Pas "Ex. 2, 3, 5: aplicarea migrarilor init, date_test si modificari (prisma migrate dev)" { npm run migrate:dev }
Pas "Ex. 2: starea migrarilor (prisma migrate status)" { npm run migrate:status }
Pas "Ex. 3: datele din migrare, inainte de seed" {
    psql -h localhost -U postgres -d $baza -c "SELECT id, cod, descriere FROM planuri ORDER BY id" -c "SELECT id, cod, procent_reducere FROM cupoane_reducere ORDER BY id"
}
Pas "Ex. 3: seed-ul (prisma db seed)" {
    npm run db:seed 2>&1 | Tee-Object -FilePath "$dest\seed.txt"
}

# ---------------------------------------------------------------
# Exercitiile 4, 5 si 7: aplicatia consola, in ambele moduri de incarcare
# ---------------------------------------------------------------
Pas "Ex. 4, 5, 7: aplicatia consola, INCARCARE_RELATII=eager" {
    $env:INCARCARE_RELATII = "eager"
    npm start --silent 2>&1 | Tee-Object -FilePath "$dest\consola_eager.txt"
}
Pas "Ex. 7: aplicatia consola, INCARCARE_RELATII=lazy" {
    $env:INCARCARE_RELATII = "lazy"
    npm start --silent 2>&1 | Tee-Object -FilePath "$dest\consola_lazy.txt"
}
Remove-Item Env:INCARCARE_RELATII -ErrorAction SilentlyContinue
Pas "Verificarea tipurilor in cele patru proiecte (tsc)" { npm run typecheck }

# ---------------------------------------------------------------
# Exercitiul 6: aplicatia web foloseste proprietatile si modelul nou
# ---------------------------------------------------------------
Push-Location $proiect
Pas "Ex. 6: aplicatia web - migrarea modificari_planuri_cupoane_facturi (prisma migrate deploy)" { npx prisma migrate deploy }
Pas "Ex. 6: aplicatia web - regenerarea clientului (prisma generate)" { npx prisma generate }
Pas "Ex. 6: aplicatia web - datele de test (prisma db seed)" { npx prisma db seed }
Pas "Ex. 6: aplicatia web si baza de date sunt sincronizate (prisma migrate status)" { npx prisma migrate status }
Pas "Ex. 6: aplicatia web - verificarea tipurilor (tsc)" { npx tsc --noEmit }
Pop-Location

# ---------------------------------------------------------------
# Backup-ul bazei de date Code First
# ---------------------------------------------------------------
Pas "Backup logic al bazei $baza (pg_dump, format custom)" {
    pg_dump -h localhost -U postgres -F c -f "$dest\${baza}.backup" $baza
}
Pas "Backup logic al bazei $baza (pg_dump, script SQL)" {
    pg_dump -h localhost -U postgres -F p --encoding=UTF8 -f "$dest\${baza}.sql" $baza
}

# ---------------------------------------------------------------
# Fisierele de predat
# ---------------------------------------------------------------
$modele  = "$dest\1_modele"
$migrari = "$dest\2_migrari"
New-Item -ItemType Directory -Force $modele, $migrari -ErrorAction Stop | Out-Null
Copy-Item "$orm\librarie-modele\prisma\schema\*.prisma" $modele -ErrorAction Stop
Copy-Item "$orm\repository-codefirst\src\BlockManagerContext.ts", "$orm\repository-codefirst\prisma.config.ts", "$orm\repository-codefirst\prisma\seed.ts" $modele -ErrorAction Stop
Copy-Item "$orm\repository-codefirst\prisma\migrations\*" $migrari -Recurse -Force -ErrorAction Stop

Set-Location $proiect
Write-Host ""
Write-Host "Gata. Fisierele de predat sunt in $dest" -ForegroundColor Green
Get-ChildItem $dest -Recurse -File | Format-Table FullName, Length
