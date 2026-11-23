# BlockManager - Laborator 7: testarea endpoint-urilor API
#
# Ruleaza intr-un AL DOILEA terminal, cat timp API-ul porneste din pasi_api.ps1:
#   .\laboratoare\laborator7\teste_api.ps1
#
# Trimite aceleasi cereri ca in colectia Postman (curl.exe, inclus in Windows) si salveaza
# cererile si raspunsurile in laboratoare\laborator7\teste_api.txt.

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [Text.Encoding]::UTF8
$OutputEncoding = [Text.Encoding]::UTF8

$dest  = "D:\BlocManager\laboratoare\laborator7"
$base  = "http://localhost:3002"
$iesire = "$dest\teste_api.txt"
$corp  = Join-Path $env:TEMP "blockmanager_corp.json"
$raspuns = Join-Path $env:TEMP "blockmanager_raspuns.json"
$rezultat = New-Object System.Collections.Generic.List[string]

function Cerere([string]$titlu, [string]$metoda, [string]$cale, [string]$json = $null, [int]$asteptat) {
    $argumente = @("-s", "-X", $metoda, "-o", $raspuns, "-w", "%{http_code}", "$base$cale")
    if ($json) {
        [IO.File]::WriteAllText($corp, $json, (New-Object Text.UTF8Encoding $false))
        $argumente += @("-H", "Content-Type: application/json", "--data-binary", "@$corp")
    }
    $cod = & curl.exe @argumente
    if ($LASTEXITCODE -ne 0) { throw "API-ul nu raspunde la $base. Porneste-l intai cu pasi_api.ps1." }
    $text = [IO.File]::ReadAllText($raspuns, [Text.Encoding]::UTF8)
    $stare = if ([int]$cod -eq $asteptat) { "OK" } else { "DIFERIT (asteptat $asteptat)" }
    $bloc = @("### $titlu", "$metoda $cale")
    if ($json) { $bloc += "Body: $json" }
    $bloc += @("Raspuns: HTTP $cod - $stare", $text, "")
    $bloc | ForEach-Object { $rezultat.Add($_) }
    Write-Host ("{0,-40} HTTP {1}  {2}" -f $titlu, $cod, $stare) -ForegroundColor $(if ($stare -eq "OK") { "Green" } else { "Yellow" })
    return $text
}

$cod = "IARNA" + (Get-Random -Minimum 100 -Maximum 999)
Cerere "1. Get - toate cupoanele" GET "/api/cupoane" -asteptat 200 | Out-Null
Cerere "2. Get(id) - cuponul 3" GET "/api/cupoane/3" -asteptat 200 | Out-Null
Cerere "3. Get(id) - cupon inexistent" GET "/api/cupoane/99" -asteptat 404 | Out-Null
$nou = Cerere "4. Post - cupon nou" POST "/api/cupoane" "{`"cod`":`"$cod`",`"reducereProcent`":12.5,`"planCod`":`"MAX`",`"valabilPana`":`"2027-02-28`",`"utilizariMaxime`":40,`"activ`":true}" -asteptat 201
$id = ($nou | ConvertFrom-Json).id
Cerere "5. Post - date gresite" POST "/api/cupoane" '{"cod":"ab","reducereProcent":150,"valabilPana":"28.02.2027","utilizariMaxime":0}' -asteptat 400 | Out-Null
Cerere "6. Post - cod existent" POST "/api/cupoane" '{"cod":"MAX15","reducereProcent":5,"planCod":null,"valabilPana":"2027-01-31","utilizariMaxime":5}' -asteptat 409 | Out-Null
Cerere "7. Put - modifica cuponul nou" PUT "/api/cupoane/$id" "{`"cod`":`"$cod`",`"reducereProcent`":15,`"planCod`":null,`"valabilPana`":`"2027-03-31`",`"utilizariMaxime`":60,`"activ`":false}" -asteptat 200 | Out-Null
Cerere "8. Put - cupon inexistent" PUT "/api/cupoane/99" '{"cod":"X99","reducereProcent":5,"planCod":null,"valabilPana":"2027-01-31","utilizariMaxime":5}' -asteptat 404 | Out-Null
Cerere "9. Get(id) - cuponul dupa Put" GET "/api/cupoane/$id" -asteptat 200 | Out-Null

[IO.File]::WriteAllLines($iesire, $rezultat, (New-Object Text.UTF8Encoding $false))
Write-Host ""
Write-Host "Cererile si raspunsurile sunt salvate in $iesire" -ForegroundColor Green
