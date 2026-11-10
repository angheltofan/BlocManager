# BlockManager - backup logic si fizic al bazei de date (Laborator 2)
#
# Ruleaza din D:\BlocManager, in terminalul din VS Code:
#   .\laboratoare\laborator2\backup_pasi.ps1
#
# Scriptul executa, in ordine, pasii descrisi in BlockManager_Pasi_backup_baza_de_date.pdf
# si salveaza fisierele de predat in laboratoare\laborator2.

# Comenzile PostgreSQL scriu mesaje informative pe stderr; erorile reale sunt prinse prin codul de iesire, in functia Pas.
$ErrorActionPreference = "Continue"

$pgBin   = "C:\Program Files\PostgreSQL\18\bin"
$dest    = "D:\BlocManager\laboratoare\laborator2"
$work    = "D:\backup"
$fizic   = "$work\blockmanager_fizic"
$restore = "D:\pgrestore"

$control = "SELECT (SELECT count(*) FROM utilizatori) AS utilizatori, (SELECT count(*) FROM apartamente) AS apartamente, (SELECT count(*) FROM tranzactii_tokeni) AS tranzactii, (SELECT count(*) FROM fise_intretinere) AS fise, (SELECT sum(tokeni_plan + tokeni_extra) FROM portofele_tokeni) AS tokeni, (SELECT count(*) FROM _prisma_migrations) AS migrari;"

function Pas([string]$titlu, [scriptblock]$comanda) {
    Write-Host ""
    Write-Host "== $titlu" -ForegroundColor Cyan
    $global:LASTEXITCODE = 0
    & $comanda
    if ($LASTEXITCODE -ne 0) { throw "Pasul '$titlu' a esuat (cod de iesire $LASTEXITCODE)." }
}

# ---------------------------------------------------------------
# Pregatire
# ---------------------------------------------------------------
$env:Path = "$pgBin;$env:Path"
if (-not $env:PGPASSWORD) {
    $sigur = Read-Host "Parola utilizatorului postgres" -AsSecureString
    $env:PGPASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($sigur))
}
New-Item -ItemType Directory -Force $work, $dest -ErrorAction Stop | Out-Null

Pas "Versiunea utilitarelor PostgreSQL" { pg_dump --version }
Pas "Valorile de control pe baza originala" { psql -h localhost -U postgres -d blockmanager -c $control }

# ---------------------------------------------------------------
# Backup logic
# ---------------------------------------------------------------
Pas "Backup logic in format SQL (pg_dump --format=plain)" {
    pg_dump -h localhost -p 5432 -U postgres -d blockmanager --format=plain --encoding=UTF8 --no-owner --no-privileges --file="$dest\blockmanager_backup_logic.sql"
}
Pas "Backup logic in format custom (pg_dump --format=custom)" {
    pg_dump -h localhost -p 5432 -U postgres -d blockmanager --format=custom --file="$dest\blockmanager_backup_logic.backup"
}

Pas "Restaurare din fisierul SQL in baza blockmanager_restore" {
    dropdb -h localhost -U postgres --if-exists blockmanager_restore
    createdb -h localhost -U postgres blockmanager_restore
    psql -h localhost -U postgres -d blockmanager_restore -q -v ON_ERROR_STOP=1 -f "$dest\blockmanager_backup_logic.sql"
}
Pas "Valorile de control pe blockmanager_restore" { psql -h localhost -U postgres -d blockmanager_restore -c $control }

Pas "Restaurare din fisierul custom in baza blockmanager_restore2" {
    dropdb -h localhost -U postgres --if-exists blockmanager_restore2
    createdb -h localhost -U postgres blockmanager_restore2
    pg_restore -h localhost -U postgres -d blockmanager_restore2 --no-owner "$dest\blockmanager_backup_logic.backup"
}
Pas "Valorile de control pe blockmanager_restore2" { psql -h localhost -U postgres -d blockmanager_restore2 -c $control }

# ---------------------------------------------------------------
# Backup fizic
# ---------------------------------------------------------------
Pas "Setarile necesare pentru pg_basebackup" {
    psql -h localhost -U postgres -c "SHOW wal_level;" -c "SHOW max_wal_senders;"
}

if (Test-Path $fizic) { Remove-Item -Recurse -Force $fizic -ErrorAction Stop }
Pas "Backup fizic (pg_basebackup)" {
    pg_basebackup -h localhost -p 5432 -U postgres -D "$fizic" --format=tar --gzip --wal-method=stream --checkpoint=fast --label="blockmanager_backup_fizic" --progress
}
Pas "Fisierele rezultate" { Get-ChildItem $fizic | Format-Table Name, Length }

Pas "Arhivarea backup-ului fizic" {
    Compress-Archive -Path "$fizic\*" -DestinationPath "$dest\blockmanager_backup_fizic.zip" -Force -ErrorAction Stop
}

# restaurare de test intr-un folder separat, pe portul 5433
if (Test-Path "$restore\data\postmaster.pid") { pg_ctl -D "$restore\data" stop -m fast | Out-Null }
if (Test-Path $restore) { Remove-Item -Recurse -Force $restore -ErrorAction Stop }
New-Item -ItemType Directory -Force "$restore\data" -ErrorAction Stop | Out-Null

Pas "Extragerea backup-ului fizic in D:\pgrestore\data" {
    tar -xzf "$fizic\base.tar.gz" -C "$restore\data"
    tar -xzf "$fizic\pg_wal.tar.gz" -C "$restore\data\pg_wal"
}
Pas "Verificarea backup-ului fizic (pg_verifybackup)" {
    pg_verifybackup -m "$fizic\backup_manifest" "$restore\data"
}
Pas "Pornirea copiei restaurate pe portul 5433" {
    pg_ctl -D "$restore\data" -o "-p 5433" -l "$restore\log.txt" -w start
}
try {
    Pas "Valorile de control pe copia restaurata (port 5433)" { psql -h localhost -p 5433 -U postgres -d blockmanager -c $control }
}
finally {
    Pas "Oprirea copiei restaurate" { pg_ctl -D "$restore\data" -w stop }
}

# ---------------------------------------------------------------
# Curatenie: bazele de test create pentru restaurarea logica
# ---------------------------------------------------------------
Pas "Stergerea bazelor de test" {
    dropdb -h localhost -U postgres --if-exists blockmanager_restore
    dropdb -h localhost -U postgres --if-exists blockmanager_restore2
}

Write-Host ""
Write-Host "Gata. Fisierele de predat sunt in $dest" -ForegroundColor Green
Get-ChildItem $dest -File | Format-Table Name, Length
