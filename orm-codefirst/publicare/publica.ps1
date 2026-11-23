# BlockManager - Laborator 8: publicarea aplicatiilor pe serverul web IIS
#
# Ruleaza in PowerShell DESCHIS CA ADMINISTRATOR (click dreapta pe PowerShell -> Run as administrator):
#   cd D:\BlocManager\orm-codefirst\publicare
#   .\publica.ps1
#
# Rezultatul:
#   http://proiect-mvc-demo.com  -> aplicatia MVC (sectiunea de administrare)
#   http://proiect-api-demo.com  -> aplicatia WebAPI (API-ul REST si sectiunea de utilizator)
# Aplicatiile ruleaza din C:\BlockManager\aplicatie (copie separata de proiectul din VS Code), pornite de pm2,
# iar IIS le primeste cererile pe cele doua nume de host. Scriptul poate fi rulat din nou dupa orice modificare.

param([string]$Destinatie = "C:\BlockManager")

$ErrorActionPreference = "Continue"
[Console]::OutputEncoding = [Text.Encoding]::UTF8
$OutputEncoding = [Text.Encoding]::UTF8
$sursa    = Split-Path $PSScriptRoot -Parent          # D:\BlocManager\orm-codefirst
$aplicatie = Join-Path $Destinatie "aplicatie"
$lab8     = Join-Path (Split-Path $sursa -Parent) "laboratoare\laborator8"
$site = @(
    @{ Nume = "proiect-MVC-demo.com"; Host = "proiect-mvc-demo.com"; Folder = "proiect-mvc-demo"; Port = 3001 },
    @{ Nume = "proiect-api-demo.com"; Host = "proiect-api-demo.com"; Folder = "proiect-api-demo"; Port = 3002 }
)

function Pas([string]$titlu, [scriptblock]$comanda) {
    Write-Host ""
    Write-Host "== $titlu" -ForegroundColor Cyan
    $global:LASTEXITCODE = 0
    & $comanda
    if ($LASTEXITCODE -ne 0) { throw "Pasul '$titlu' a esuat (cod de iesire $LASTEXITCODE)." }
}

$admin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $admin) { throw "Ruleaza scriptul intr-un PowerShell deschis cu 'Run as administrator' (IIS si fisierul hosts cer drepturi de administrator)." }
if (-not (Test-Path "$sursa\repository-codefirst\.env")) { throw "Lipseste $sursa\repository-codefirst\.env. Ruleaza intai ..\instalare.ps1." }
New-Item -ItemType Directory -Force $Destinatie, $lab8 | Out-Null

# ---------------------------------------------------------------
# 1. Pachetul de publicare: o copie a aplicatiei, separata de mediul de dezvoltare
# ---------------------------------------------------------------
Pas "1. Copierea aplicatiei in $aplicatie" {
    robocopy $sursa $aplicatie /MIR /XD node_modules logs generated .git /XF .env /NFL /NDL /NJH /NJS /NP | Out-Null
    if ($LASTEXITCODE -lt 8) { $global:LASTEXITCODE = 0 }   # robocopy: codurile 0-7 inseamna succes
}

Pas "2. Configurarea pentru productie (fisierele .env)" {
    $linie = Get-Content "$sursa\repository-codefirst\.env" | Where-Object { $_ -match '^DATABASE_URL=' } | Select-Object -First 1
    $comun = @($linie, 'INCARCARE_RELATII="eager"')
    Set-Content "$aplicatie\repository-codefirst\.env" -Value $comun -Encoding ascii
    Set-Content "$aplicatie\web-mvc\.env" -Value ($comun + 'PORT=3001', 'ADRESA_UTILIZATOR="http://proiect-api-demo.com"') -Encoding ascii
    Set-Content "$aplicatie\web-api\.env" -Value ($comun + 'PORT=3002', 'ADRESA_ADMIN="http://proiect-mvc-demo.com"', 'JOB_INTERVAL_MINUTE=60') -Encoding ascii
    Write-Host "Baza de date: aceeasi ca in dezvoltare (blockmanager_codefirst)."
}

Set-Location $aplicatie
Pas "3. Instalarea pachetelor in folderul publicat (npm ci)" { npm ci --no-audit --no-fund }
Pas "4. Migrarile aplicate pe baza de date (prisma migrate deploy)" { npm run migrate:deploy }

# ---------------------------------------------------------------
# 5. Aplicatiile Node pornite in fundal cu pm2 (fara VS Code si fara terminal deschis)
# ---------------------------------------------------------------
# pm2 este rulat direct cu node (nu prin pm2.cmd): pm2.cmd nu functioneaza din Windows PowerShell
# cand calea profilului contine spatii (de exemplu C:\Users\Nume Prenume).
$node = (Get-Command node -ErrorAction Stop).Source
$pm2Js = Join-Path ((npm root -g) | Select-Object -Last 1).Trim() "pm2\bin\pm2"
function pm2 { & $node $pm2Js @args }
if (-not (Test-Path $pm2Js)) { Pas "5a. Instalarea pm2 (npm install -g pm2)" { npm install -g pm2 --no-audit --no-fund } }
if (-not (Test-Path $pm2Js)) { throw "Nu gasesc pm2 la $pm2Js dupa instalare." }
Write-Host "pm2: $pm2Js"
Pas "5b. Pornirea aplicatiilor cu pm2" {
    pm2 delete blockmanager-mvc 2>&1 | Out-Null
    pm2 delete blockmanager-api 2>&1 | Out-Null
    $global:LASTEXITCODE = 0
    pm2 start "$aplicatie\publicare\ecosystem.config.cjs"
    if ($LASTEXITCODE -eq 0) { pm2 save }
}
Pas "5c. Repornirea automata la logare (Task Scheduler: pm2 resurrect)" {
    $actiune = New-ScheduledTaskAction -Execute $node -Argument "`"$pm2Js`" resurrect"
    $declansator = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
    Register-ScheduledTask -TaskName "BlockManager - pm2" -Action $actiune -Trigger $declansator -RunLevel Highest -Force -ErrorAction Stop | Out-Null
    Write-Host "Task-ul 'BlockManager - pm2' porneste aplicatiile la fiecare logare."
}

# ---------------------------------------------------------------
# 6. Serverul web IIS, cu URL Rewrite si Application Request Routing (proxy invers)
# ---------------------------------------------------------------
Pas "6a. Activarea IIS (Windows Features)" {
    $functii = "IIS-WebServerRole", "IIS-WebServer", "IIS-CommonHttpFeatures", "IIS-DefaultDocument", "IIS-StaticContent",
               "IIS-HttpErrors", "IIS-RequestFiltering", "IIS-ManagementConsole", "IIS-ManagementScriptingTools"
    foreach ($f in $functii) {
        if ((Get-WindowsOptionalFeature -Online -FeatureName $f).State -ne "Enabled") {
            Write-Host "Activez $f"
            Enable-WindowsOptionalFeature -Online -FeatureName $f -All -NoRestart -ErrorAction Stop | Out-Null
        }
    }
}

function RepornireInAsteptare {
    (Test-Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Component Based Servicing\RebootPending") -or
    (Test-Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\WindowsUpdate\Auto Update\RebootRequired")
}
function InstaleazaMsi([string]$nume, [string]$url, [string]$fisierVerificare) {
    if (Test-Path $fisierVerificare) { Write-Host "$nume este deja instalat."; return }
    # kit-urile se descarca intr-un folder fara spatii sau caractere speciale (nu in %TEMP% din profil)
    $kit = Join-Path $Destinatie "kit"
    New-Item -ItemType Directory -Force $kit | Out-Null
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    $msi = Join-Path $kit ([IO.Path]::GetFileName($url))
    $jurnal = [IO.Path]::ChangeExtension($msi, ".log")
    if (-not (Test-Path $msi)) { Write-Host "Descarc $nume..."; Invoke-WebRequest $url -OutFile $msi -UseBasicParsing -ErrorAction Stop }
    Write-Host "Instalez $nume (jurnal: $jurnal)..."
    $p = Start-Process msiexec.exe -ArgumentList "/i `"$msi`" /quiet /norestart /l*v `"$jurnal`"" -Wait -PassThru
    if ($p.ExitCode -eq 0 -or $p.ExitCode -eq 3010) { Write-Host "$nume instalat."; return }
    if (Test-Path $jurnal) {
        $linii = Get-Content $jurnal
        $k = ($linii | Select-String "Return value 3" | Select-Object -First 1).LineNumber
        if ($k) { Write-Host "Din jurnalul instalarii:" -ForegroundColor Yellow; $linii[[Math]::Max(0, $k - 12)..($k - 1)] | ForEach-Object { Write-Host "  $_" } }
    }
    if (RepornireInAsteptare) {
        throw "Instalarea $nume a esuat (msiexec $($p.ExitCode)), iar Windows asteapta o repornire dupa activarea IIS. Reporneste calculatorul si ruleaza din nou scriptul (pasii facuti deja sunt sariti)."
    }
    throw "Instalarea $nume a esuat (msiexec $($p.ExitCode)). Jurnalul complet: $jurnal"
}
Pas "6b. Modulul URL Rewrite 2.1" {
    InstaleazaMsi "URL Rewrite 2.1" "https://download.microsoft.com/download/1/2/8/128E2E22-C1B9-44A4-BE2A-5859ED1D4592/rewrite_amd64_en-US.msi" "$env:SystemRoot\System32\inetsrv\rewrite.dll"
}
Pas "6c. Application Request Routing 3.0 (proxy)" {
    InstaleazaMsi "Application Request Routing 3.0" "https://download.microsoft.com/download/E/9/8/E9849D6A-020E-47E4-9FD0-A023E99B54EB/requestRouter_amd64.msi" "$env:ProgramFiles\IIS\Application Request Routing\requestRouter.dll"
}

Import-Module WebAdministration -ErrorAction Stop
Pas "6d. Activarea proxy-ului ARR la nivel de server" {
    Set-WebConfigurationProperty -PSPath "MACHINE/WEBROOT/APPHOST" -Filter "system.webServer/proxy" -Name "enabled" -Value "True" -ErrorAction Stop
}

Pas "6e. Site-urile IIS cu numele de host" {
    foreach ($s in $site) {
        $folder = "C:\inetpub\$($s.Folder)"
        New-Item -ItemType Directory -Force $folder | Out-Null
        Copy-Item "$aplicatie\publicare\iis\$($s.Folder)\web.config" $folder -Force
        if (-not (Test-Path "IIS:\AppPools\$($s.Folder)")) { New-WebAppPool -Name $s.Folder | Out-Null }
        Set-ItemProperty "IIS:\AppPools\$($s.Folder)" -Name managedRuntimeVersion -Value ""
        if (Get-Website -Name $s.Nume) { Remove-Website -Name $s.Nume }
        New-Website -Name $s.Nume -HostHeader $s.Host -Port 80 -IPAddress "*" -PhysicalPath $folder -ApplicationPool $s.Folder -ErrorAction Stop | Out-Null
        Start-Website -Name $s.Nume
        Write-Host "Site $($s.Nume): http://$($s.Host) -> http://localhost:$($s.Port)"
    }
}

# ---------------------------------------------------------------
# 7. Numele de host: fisierul hosts trimite cele doua domenii la acest calculator
# ---------------------------------------------------------------
Pas "7. Inregistrarea numelor de host in fisierul hosts" {
    $hosts = "$env:SystemRoot\System32\drivers\etc\hosts"
    $continut = Get-Content $hosts -ErrorAction Stop
    $lipsa = @($site | Where-Object { $h = [regex]::Escape($_.Host); -not ($continut | Where-Object { $_ -match "^\s*127\.0\.0\.1\s+$h\s*$" }) })
    if ($lipsa.Count -eq 0) { Write-Host "Numele de host sunt deja in fisierul hosts." }
    else {
        $linii = $lipsa | ForEach-Object { "127.0.0.1`t$($_.Host)" }
        # fisierul hosts poate fi blocat cateva momente de antivirus sau de serviciul DNS: se reincearca
        for ($incercare = 1; ; $incercare++) {
            try { Add-Content $hosts $linii -Encoding ascii -ErrorAction Stop; break }
            catch { if ($incercare -ge 10) { throw "Nu pot scrie in $hosts ($($_.Exception.Message))." }; Start-Sleep -Seconds 2 }
        }
        $linii | ForEach-Object { Write-Host "Adaugat: $_" }
    }
    ipconfig /flushdns | Out-Null
}

# ---------------------------------------------------------------
# 8. Verificarea: aplicatiile raspund pe numele de host, prin IIS
# ---------------------------------------------------------------
Pas "8. Verificarea publicarii" {
    $rezultat = New-Object System.Collections.Generic.List[string]
    $rezultat.Add("Verificarea publicarii BlockManager - $(Get-Date -Format 'dd.MM.yyyy HH:mm')")
    for ($i = 0; $i -lt 30; $i++) {
        try { Invoke-WebRequest "http://localhost:3002/api/planuri" -UseBasicParsing -TimeoutSec 3 | Out-Null; break } catch { Start-Sleep -Seconds 2 }
    }
    $adrese = "http://proiect-mvc-demo.com/abonamente", "http://proiect-mvc-demo.com/cupoane", "http://proiect-api-demo.com/", "http://proiect-api-demo.com/api/planuri", "http://proiect-api-demo.com/admin/cupoane.html"
    $erori = 0
    foreach ($a in $adrese) {
        try {
            $r = Invoke-WebRequest $a -UseBasicParsing -TimeoutSec 15
            $linie = "{0,-45} HTTP {1}  {2}" -f $a, $r.StatusCode, $r.Headers["Server"]
        } catch {
            $erori++
            $linie = "{0,-45} EROARE: {1}" -f $a, $_.Exception.Message
        }
        $rezultat.Add($linie)
        Write-Host $linie
    }
    $rezultat.Add("")
    $rezultat.Add("Procesele pm2:")
    # lista pm2 e citita cu node (ConvertFrom-Json din PowerShell 5.1 refuza cheile username/USERNAME din raspuns)
    $citeste = "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{for(const a of JSON.parse(s.replace(/^\uFEFF/,'')))console.log('  '+a.name.padEnd(18)+' '+a.pm2_env.status.padEnd(8)+' pid '+a.pid+', reporniri '+a.pm2_env.restart_time)})"
    pm2 jlist | & $node -e $citeste | ForEach-Object { $rezultat.Add($_) }
    $rezultat.Add("")
    $rezultat.Add("Site-urile IIS:")
    Get-Website | Where-Object { $_.Name -like "proiect-*" } | ForEach-Object { $rezultat.Add(("  {0,-24} {1,-8} {2}" -f $_.Name, $_.State, ($_.Bindings.Collection | ForEach-Object { $_.bindingInformation }) -join ", ")) }
    [IO.File]::WriteAllLines("$lab8\verificare_publicare.txt", $rezultat, (New-Object Text.UTF8Encoding $false))
    if ($erori -gt 0) { throw "$erori adrese nu au raspuns. Vezi $lab8\verificare_publicare.txt" }
}

Write-Host ""
Write-Host "Publicarea s-a terminat:" -ForegroundColor Green
Write-Host "  http://proiect-mvc-demo.com   (sectiunea de administrare, MVC)" -ForegroundColor Green
Write-Host "  http://proiect-api-demo.com   (API-ul si sectiunea de utilizator)" -ForegroundColor Green
Write-Host "Rezultatul verificarii: $lab8\verificare_publicare.txt" -ForegroundColor Green
Start-Process "http://proiect-api-demo.com/"
Start-Process "http://proiect-mvc-demo.com/abonamente"
