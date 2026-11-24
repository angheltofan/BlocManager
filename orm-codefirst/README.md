# BlockManager (aplicatia finala)

SaaS cu abonament pentru asociatiile de proprietari. Nucleul este monetizarea: planurile Free, Pro si Max,
plata lunara simulata si tokenii consumati de actiunile importante.

Solutia are sapte proiecte (npm workspaces), pe straturi:

| Proiect | Rol |
| --- | --- |
| `librarie-modele` | entitatile (schema Prisma Code First, `prisma/schema/*.prisma`) si clientul generat |
| `repository-codefirst` | `BlockManagerContext` (derivat din PrismaClient), migrarile, seed-ul |
| `nivel-acces-date` | accesorii: `PlanuriAccessor`, `CupoaneAccessor`, `AbonamenteAccessor` |
| `servicii` | nivelul Services: logica de business, container DI (awilix), cache, loguri, evenimente |
| `web-mvc` | sectiunea de administrare (MVC, Express + EJS), http://localhost:3001 |
| `web-api` | API-ul REST si sectiunea de utilizator ("Abonamentul meu"), http://localhost:3002 |
| `test-console-codefirst` | aplicatia consola din Laboratorul 4 (eager / lazy loading) |

## Instalare si pornire (Windows, PowerShell)

Cerinte: Node.js 22 LTS (minim 20.19) si PostgreSQL 16 sau mai nou.

```
cd D:\BlocManager\orm-codefirst
.\instalare.ps1      # .env, npm install, baza de date, migrari, seed (o singura data)
.\porneste.ps1       # porneste admin (3001) si utilizator + API (3002)
```

Pornire manuala: `npm run admin` (sectiunea de admin) si `npm run api` (API + sectiunea de utilizator).

## Nivelul Services (`servicii`)

| Serviciu | Ce face |
| --- | --- |
| `ServiciuPlanuri` | planurile, pachetele de tokeni si actiunile taxate, prin cache (10 minute) |
| `ServiciuComenzi` | alegerea unui plan: abonament nou, upgrade, downgrade programat; comenzi de pachete; anulare |
| `ServiciuPlati` | plata simulata: comanda achitata, abonament activ, tokeni alocati; publica `PlataEfectuata` |
| `ServiciuTokeni` | portofelul si jurnalul; debitarea actiunilor taxate, cu actualizare conditionata |
| `ServiciuAbonamente` | administrarea abonamentelor (Details, Edit, anulare logica) si starea unei asociatii |
| `ServiciuCupoane` | CRUD cupoane cu stergere logica; valabilitatea unui cupon la o comanda |
| `ServiciuReinnoire` | jobul zilnic: reinnoieste Free, suspenda Pro/Max pana la plata, aplica downgrade-urile |

Evenimentul `PlataEfectuata` are trei consumatori independenti: `ConsumatorFacturi` (factura simulata),
`ConsumatorNotificari` (notificare pentru administratorii asociatiei) si `ConsumatorAudit` (`logs/audit-plati.log`).
`AbonamentSuspendat`, publicat de jobul zilnic, este preluat de notificari si de audit.

Logurile aplicatiei sunt in `logs/blockmanager.log` (o linie JSON pe mesaj).

## Endpoint-uri API

| Endpoint | Ce face |
| --- | --- |
| `GET /api/planuri`, `/api/pachete`, `/api/actiuni` | oferta: planuri, pachete de tokeni, costul actiunilor |
| `GET /api/asociatii`, `/api/asociatii/:id/stare` | asociatiile; abonamentul, portofelul, comenzile, jurnalul, facturile |
| `POST /api/asociatii/:id/abonament` | alege un plan `{ planCod, codCupon? }` |
| `POST /api/asociatii/:id/pachete` | comanda un pachet de tokeni `{ pachetId }` |
| `POST /api/asociatii/:id/actiuni` | executa o actiune taxata `{ cod }` |
| `POST /api/comenzi/:id/plata`, `/anulare` | plata simulata, anularea unei comenzi |
| `GET /api/cupoane/verifica?cod=&planCod=` | pretul unui plan dupa reducere |
| `GET/POST /api/cupoane`, `GET/PUT/DELETE /api/cupoane/:id` | CRUD cupoane (Laboratorul 7), DTO-uri si AutoMapper |

Colectia Postman: `web-api/BlockManager_API.postman_collection.json`.

## Migrari

1. `20261110150000_init`: toate tabelele, cheile primare si straine
2. `20261110150100_date_test`: planurile FREE, PRO si doua cupoane
3. `20261110160000_modificari_planuri_cupoane_facturi`: pret anual, recomandat, procent zecimal, `facturi_simulate`
4. `20261111120000_date_asociatii_abonamente`: 4 asociatii, 2 abonamente, o comanda achitata
5. `20261123120000_stergere_logica_cupoane`: `cupoane_reducere.sters_la`
6. `20261123120100_date_monetizare`: actiunile taxate, pachetele, administratorii asociatiilor, portofelele si jurnalul
7. `20261123160000_stergere_logica_pachete`: coloana `pachete_tokeni.sters_la` (Laboratorul 9)
8. `20261123160100_date_notificari`: notificari de test pentru administratori (Laboratorul 9)

Seed-ul (`npm run db:seed`) adauga planul MAX si cupoanele MAX15, VARA5. Comenzi utile: `npm run typecheck`,
`npm run migrate:deploy`, `npm run migrate:dev -- --name <nume>` (dupa o modificare in `librarie-modele/prisma/schema`).

## Publicare pe IIS (Laboratorul 8)

Din PowerShell deschis ca Administrator:

```powershell
cd D:\BlocManager\orm-codefirst\publicare
.\publica.ps1
```

Scriptul copiaza aplicatia in `C:\BlockManager\aplicatie`, o porneste cu pm2, activeaza IIS (URL Rewrite + ARR) si creeaza site-urile:

| Adresa | Aplicatia | Proces Node |
| --- | --- | --- |
| http://proiect-mvc-demo.com | MVC (admin) | localhost:3001 |
| http://proiect-api-demo.com | WebAPI, sectiunea de utilizator (`/`) si pagina admin `/admin/cupoane.html` | localhost:3002 |

Numele de host sunt trecute in `C:\Windows\System32\drivers\etc\hosts`. Rezultatul verificarii: `laboratoare\laborator8\verificare_publicare.txt`.

## Stergerea (Laboratorul 9)

| Entitate | Tip | Unde | De ce |
| --- | --- | --- | --- |
| `Notificare` | fizica (`DELETE`) | admin: http://localhost:3001/notificari | niciun alt tabel nu o refera; istoricul nu depinde de ea |
| `PachetTokeni` | logica (`sters_la`) | admin: http://localhost:3001/pachete | e referit de `comenzi_simulate.pachet_id` |
| `CuponReducere` | logica (`sters_la`) | admin: /cupoane | cupoanele folosite raman in istoric |

Get si GetAll omit entitatile sterse logic; in admin, filtrul „Arata si ... sterse” le afiseaza, cu buton de restaurare.
