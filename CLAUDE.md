# BlockManager

Platformă web SaaS cu abonament pentru asociațiile de proprietari. **Nucleul aplicației este mecanismul de monetizare**: planurile Free, Pro și Max, plata lunară simulată a abonamentului și tokenii consumați de acțiunile importante, reînnoiți la fiecare perioadă. Administrarea blocului (apartamente, apometre, calculul întreținerii, încasări) este domeniul în care se consumă tokenii.

Când trebuie ales ce să construiești sau cât de bine, prioritatea este fluxul de abonament și tokeni: să fie complet, consecvent în baza de date și ușor de urmărit. Partea de administrare poate rămâne simplificată.

Proiect de laborator (PPAW), lucrat de o singură persoană pe Windows, în VS Code.

## Stack și versiuni

- **Next.js 16.4** (App Router, Turbopack), React 19, TypeScript, Tailwind CSS 4
- **Prisma ORM 7.10.1**, cu adaptorul `@prisma/adapter-pg` (fără motor binar pentru client)
- **PostgreSQL 16**
- Node.js 22 LTS (minim 20.19)

Planificate, încă neinstalate: Auth.js pentru autentificare cu roluri, `node-cron` pentru jobul zilnic.

## Comenzi

```bash
npm run dev            # serverul de dezvoltare, http://localhost:3000
npm run build          # build de producție (verifică și tipurile)
npm run lint           # ESLint
npx tsc --noEmit       # verificarea tipurilor
npm run db:migrate     # prisma migrate deploy
npm run db:seed        # golește tabelele și inserează datele de test (idempotent)
npm run db:studio      # Prisma Studio
npx prisma migrate dev --name <nume>   # migrare nouă după o modificare în schema.prisma
npx prisma generate    # regenerează clientul (rulează automat la npm install)
```

Înainte să spui că o modificare e gata: `npm run lint`, `npx tsc --noEmit` și `npm run build` trebuie să treacă. Dacă ai modificat schema sau seed-ul, rulează și `npm run db:seed`.

## Structura

```
prisma/schema.prisma        modelul bazei de date (30 de tabele, 15 enumerări)
prisma/migrations/          migrările; cele aplicate NU se modifică
prisma/seed.ts              datele de test
prisma.config.ts            DATABASE_URL, calea migrărilor, comanda de seed
src/lib/prisma.ts           singura instanță de PrismaClient
src/generated/prisma/       clientul generat (în .gitignore, nu se editează)
src/app/                    paginile (App Router)
orm-dbfirst/                Laborator 3: proiect separat Database First (npm workspaces), vezi mai jos
orm-codefirst/              APLICAȚIA FINALĂ (Laboratoarele 4-7 + proiect): Code First, Services, MVC admin, API + pagina utilizator, vezi mai jos
laboratoare/                livrabilele predate la fiecare laborator (PDF-uri, backup-uri); nu fac parte din aplicație
```

### orm-dbfirst (Laborator 3, Database First)

Proiect separat de aplicația web, cu `package.json` și `node_modules` proprii. Este exclus din `tsconfig.json` și din ESLint-ul aplicației.

- `repository-dbfirst/`: modelele generate din baza de date cu `npx prisma db pull` + `npx prisma generate`. Numele sunt cele din baza de date (`planuri`, `pret_lunar`). Codul din `src/generated/prisma` este generat, dar e păstrat în Git, pentru că e livrabil. Singura modificare manuală din schema introspectată este redenumirea relației `fise_intretinere.penalizari_lista` (coloana `penalizari` are același nume); Prisma o păstrează la următoarele `db pull`.
- `nivel-acces-date-dbfirst/`: `PlanuriAccessor`, `AbonamenteAccessor`.
- `test-orm-schemafirst/`: aplicația consolă (`npm start` din `orm-dbfirst`).
- `sql/`: scripturile cu care s-a modificat baza de date la Laboratorul 3 (coloana `planuri.descriere`, tabelul `cupoane_reducere`). Aceleași schimbări există în aplicație ca migrări, marcate aplicate cu `prisma migrate resolve --applied`.

Aplicația web rămâne Schema First: modificările ei de bază de date se fac prin migrări (`prisma migrate dev`). După o migrare nouă, `orm-dbfirst` se actualizează cu `npm run db:pull` și `npm run generate`, rulate din `orm-dbfirst`.

### orm-codefirst: aplicația finală (Laboratoarele 4-7 + proiect)

**Aplicația evaluată este soluția `orm-codefirst`**, nu aplicația Next.js din rădăcină (aceea a rămas pagina de test din Laboratoarele 2-4). Are `package.json` și `node_modules` proprii, e exclusă din `tsconfig.json` și ESLint-ul rădăcinii și folosește baza de date `blockmanager_codefirst`, creată doar din migrări.

Straturile (npm workspaces), de jos în sus:
- `librarie-modele/`: entitățile (schema Prisma împărțită pe domenii, în `prisma/schema/*.prisma`) și clientul generat (`src/generated/prisma`, nu se editează).
- `repository-codefirst/`: `BlockManagerContext` (derivat din `PrismaClient`, cu contor de interogări și `INCARCARE_RELATII`), `prisma.config.ts`, migrările și `prisma/seed.ts` (planuri și cupoane).
- `nivel-acces-date/`: accesorii (doar acces la date, fără reguli): `PlanuriAccessor`, `CupoaneAccessor` (inclusiv ștergere logică), `AbonamenteAccessor`, `PacheteAccessor` (ștergere logică, `sters_la`), `NotificariAccessor` (ștergere fizică).
- `servicii/`: **nivelul Services, unde stă toată logica de business**. Interfețele serviciilor (`IServiciuCupoane` etc.) sunt în `src/contracte.ts`; controllerele și serviciile depind doar de ele. Containerul DI (awilix, modul PROXY, `strict`) e în `src/container.ts`; durata de viață a accesorilor și serviciilor vine din `DURATA_VIATA_SERVICII` (singleton implicit, scoped, transient), iar infrastructura și consumatorii rămân Singleton. Serverele creează un scope DI pe cerere și controllerul în acel scope (`controller(Clasa)` din `server.ts`); pagina admin `/di` arată instanțele create; infrastructura (`Logger` în `logs/blockmanager.log`, `CacheMemorie`, `MagistralaEvenimente`, `EroareBusiness`) în `src/infrastructura`; serviciile în `src/servicii`; consumatorii de evenimente în `src/evenimente`.
- `web-mvc/`: secțiunea de admin (Express + EJS, port 3001, `npm run admin`). CRUD complet pe cupoane (ștergere logică + restaurare) și abonamente (Details, Edit, anulare = ștergere logică), pachete de tokeni (ștergere logică + restaurare), notificări (ștergere fizică) și asociații (Index + Create, cu portofel gol; din listă se creează abonamentul), plus butonul „Rulează jobul zilnic”. Un abonament suspendat fără comandă de plătit se reactivează alegând din nou același plan (se emite o comandă nouă). Controllerele primesc serviciile din container.
- `web-api/`: API-ul REST + secțiunea de utilizator (port 3002, `npm run api`). `public/` conține pagina „Abonamentul meu” (HTML + JS fără framework), care folosește doar endpoint-urile `/api/...`. `CupoaneController` (Lab 7) folosește DTO-uri + AutoMapper; `MonetizareController` expune planurile, starea asociației, alegerea planului, plata, pachetele și acțiunile.
- `test-console-codefirst/`: consola din Laboratorul 4.

Reguli de lucru:
- Controllerele (MVC și API) nu conțin reguli și nu folosesc accesorii direct: apelează serviciile. O regulă nouă se pune într-un serviciu.
- Erorile de business sunt `EroareBusiness(cod, mesaj, camp?)`; codul dă statusul HTTP (NEGASIT 404, DATE_INVALIDE 400, CONFLICT 409, ABONAMENT_INACTIV 403, PLAN_NEPERMIS 403, SOLD_INSUFICIENT 402). MVC le afișează în formular sau în `eroare.ejs`, API-ul le întoarce ca JSON.
- Evenimentele se publică după tranzacție (`magistralaEvenimente.publica`), iar consumatorii rulează asincron și izolat. `PlataEfectuata` are 3 consumatori: factură, notificare, audit (`logs/audit-plati.log`).
- Fiecare proces (admin, API) are containerul lui, deci și cache-ul lui; nu există încă editare de planuri, deci cache-ul de 10 minute nu are nevoie de invalidare între procese. Pachetele pot fi șterse din admin, de aceea cache-ul lor din API ține doar 30 de secunde.
- Ștergerea: fizică doar pentru entitățile pe care nu le referă nicio cheie străină și care nu țin istoric (notificări); logică (`sters_la`, filtrată în Get/GetAll) pentru cele referite (cupoane, pachete); abonamentele se anulează (status `ANULAT`).
- Instalare: `orm-codefirst\instalare.ps1`; pornire: `orm-codefirst\porneste.ps1`; publicare pe IIS (Lab 8): `orm-codefirst\publicare\publica.ps1`, rulat ca Administrator. Verificare înainte de livrare: `npm run typecheck` din `orm-codefirst`.

Setarea `INCARCARE_RELATII` din `.env` (`eager` sau `lazy`) alege cum se încarcă relația Plan → CuponReducere. O modificare de model se face în `librarie-modele/prisma/schema`, apoi `npm run migrate:dev -- --name <nume>` din `orm-codefirst`.

Folderul `Claude outputs/` este creat de aplicația Claude pentru fișierele trimise din chat. Nu face parte din proiect: nu-l modifica și nu te baza pe el.

## Next.js 16: reguli importante

Versiunea are schimbări față de ce știi. Înainte de cod nou pentru rutare, date, cache sau Server Actions, citește ghidul relevant din `node_modules/next/dist/docs/` (fișierul `AGENTS.md`, generat de Next, spune același lucru).

- `cacheComponents` este activat în `next.config.ts`. O componentă care citește din baza de date la fiecare cerere apelează `await connection()` (din `next/server`) și stă într-un `<Suspense>`. Vezi `src/app/page.tsx`.
- Accesul la baza de date se face doar pe server: Server Components pentru citire, Server Actions sau Route Handlers pentru scriere. Nu importa `@/lib/prisma` în componente `"use client"`.
- Regula de lint `react-hooks/error-boundaries` interzice construirea JSX-ului în `try/catch`. Citești datele într-o funcție care întoarce `{ ok, ... }` sau `{ ok: false, mesaj }`, apoi randezi în afara blocului (modelul din `page.tsx`).
- Nu folosi `next/font/google`. Fonturile sunt cele de sistem, definite în `globals.css`.

## Prisma 7: reguli importante

- Adresa bazei de date stă în `prisma.config.ts` (`env("DATABASE_URL")`, din `.env`), nu în `schema.prisma`.
- Clientul se importă din `@/generated/prisma/client`, iar în aplicație se folosește doar `prisma` din `@/lib/prisma`.
- Orice modificare de schemă trece printr-o migrare nouă (`prisma migrate dev`). Nu edita migrările deja aplicate și nu folosi `db push`.
- Modelele au nume în română, fără diacritice, în PascalCase (`PortofelTokeni`), câmpurile în camelCase (`tokeniPlan`). În PostgreSQL apar în snake_case, la plural, prin `@map` și `@@map` (`portofele_tokeni.tokeni_plan`). Păstrează convenția și la tabele noi.
- Sumele de bani sunt `Decimal` în baza de date. În calcule lucrează în bani (numere întregi), ca în `prisma/seed.ts`. Tokenii sunt `Int`.
- Dacă schimbi schema, actualizează și `prisma/seed.ts`, ca seed-ul să ruleze în continuare de la zero.

## Monetizare: regulile de business

### Planuri

| Cod | Preț simulat | Tokeni / lună | Max apartamente | Max blocuri | Raport anual |
| --- | --- | --- | --- | --- | --- |
| FREE | 0 lei | 50 | 30 | 1 | nu |
| PRO | 49 lei | 400 | 300 | 5 | da |
| MAX | 149 lei | 2000 | nelimitat (NULL) | nelimitat (NULL) | da |

Valorile stau în tabelul `planuri`. Nu le scrie direct în cod: citește-le din baza de date.

### Acțiuni taxate (tabelul `actiuni_taxabile`)

| Cod | Cost |
| --- | --- |
| CALCUL (calcul întreținere lunară) | 10 |
| RECALCUL | 5 |
| NOTIFICARI (notificări lunare către proprietari) | 5 |
| EXPORT_PDF (listă de plată) | 2 |
| RAPORT (raport anual de încasări, doar planurile cu `raportAnual`) | 15 |

### Reguli

1. **Plata este simulată.** Nu există procesator de plăți, carduri sau Stripe și nu se adaugă. Butonul „Plătește” marchează comanda din `comenzi_simulate` ca `ACHITATA`, cu `achitata_la` și o referință fictivă `SIM-AAAA-NNNNNN`. Nu colecta date de card nici măcar ca exemplu.
2. **O asociație are cel mult un abonament curent** (`ACTIV` sau `SUSPENDAT`) și un singur portofel de tokeni (`portofele_tokeni`, relație 1:1).
3. **Planul Free** se reînnoiește automat la finalul perioadei: tokenii rămași expiră, apoi se alocă 50 noi.
4. **Planurile Pro și Max** se plătesc lunar. La finalul perioadei, jobul zilnic:
   - scrie `EXPIRARE` pentru tokenii de plan rămași;
   - creează o comandă `IN_ASTEPTARE` legată de abonament (cel mult una per abonament);
   - trece abonamentul în `SUSPENDAT`.
5. **Cât timp abonamentul este `SUSPENDAT`**: nu se alocă tokeni, toate acțiunile taxate sunt refuzate, iar asociația poate doar vizualiza datele. Tokenii extra rămân păstrați.
6. **La plata simulată**, într-o singură tranzacție: comanda devine `ACHITATA`, abonamentul primește perioada următoare de o lună și devine `ACTIV`, `tokeni_plan` ia valoarea `tokeni_lunari` a planului, iar în jurnal se scrie `ALOCARE` legată de comandă.
7. **Debitarea tokenilor**, mereu în `prisma.$transaction`:
   1. verifică dacă abonamentul este `ACTIV`;
   2. citește costul acțiunii;
   3. verifică dacă `tokeni_plan + tokeni_extra >= cost`, altfel refuză cu „sold insuficient” și propune upgrade sau pachet;
   4. scade întâi din `tokeni_plan`, apoi din `tokeni_extra`, cu o actualizare condiționată, ca două cereri simultane să nu consume același sold;
   5. scrie `CONSUM` cu `cantitate = -cost` și `sold_dupa`;
   6. execută acțiunea. Dacă acțiunea eșuează, totul se anulează.
8. **Cupoanele de reducere** (`cupoane_reducere`) reduc prețul unei comenzi simulate de abonament cu `procent_reducere` (zecimal, de exemplu 7,50%). Un cupon e valabil doar dacă nu e șters (`sters_la` NULL), e `activ`, nu a trecut de `valabil_pana`, `utilizari < utilizari_maxime` și, când are `plan_id`, doar pentru acel plan. Se aplică la emiterea comenzii (`ServiciuComenzi`), iar utilizarea se numără cu o actualizare condiționată.
9. **Facturile simulate** (`facturi_simulate`): fiecare comandă `ACHITATA` are o factură (relație 1:1), cu numărul `BM-AAAA-NNNNNN`, data plății, subtotal, TVA 21% și total; suma comenzii include TVA. În `orm-codefirst`, factura o emite `ConsumatorFacturi`, la evenimentul `PlataEfectuata` (decuplat de tranzacția plății, idempotent).
10. **Planurile** au și `pret_anual` (null = fără plată anuală) și `recomandat` (planul evidențiat pe pagina de prețuri).
11. **Pachetele de tokeni** (`pachete_tokeni`: 100 tokeni / 19 lei, 300 / 49, 1000 / 129) se cumpără tot prin comandă simulată. Adaugă la `tokeni_extra`, nu expiră și se consumă după tokenii planului.
12. **Upgrade** (de exemplu Free → Pro): comandă cu prețul noului plan. După plată, abonamentul vechi devine `EXPIRAT`, se creează unul nou `ACTIV` pentru o lună, tokenii de plan vechi expiră și se alocă cei ai noului plan.
13. **Downgrade**: se salvează `plan_urmator_id`, fără plată acum. Jobul zilnic aplică planul la finalul perioadei. Dacă asociația depășește limitele noului plan, datele rămân, dar nu se mai pot adăuga apartamente sau blocuri.
14. **Limitele planului** (`max_apartamente`, `max_blocuri`) se verifică la fiecare adăugare de apartament sau bloc.
15. **Jurnalul este sursa de adevăr.** Orice schimbare a soldului (`ALOCARE`, `CONSUM`, `CUMPARARE`, `EXPIRARE`, `BONUS`) scrie un rând în `tranzactii_tokeni`. Nu actualiza niciodată `portofele_tokeni` fără rândul corespunzător. Invariant: soldul din portofel = ultimul `sold_dupa` = suma câmpului `cantitate`.

Toată logica de tokeni și abonament stă în `orm-codefirst/servicii` (regulile 1-15 sunt implementate acolo). Nu o copia în controllere sau pagini.

## Domeniul asociației: reguli

- **Roluri** (`utilizatori.rol`): `ADMIN` gestionează totul și plătește abonamentul; `PRESEDINTE` aprobă lista de plată; `PROPRIETAR` vede doar apartamentele lui (prin `proprietati`), transmite indexul apometrului, vede fișa și plătește întreținerea.
- **Ierarhia**: asociație → blocuri → scări → apartamente. Fiecare apartament are un singur apometru (`contoare`), fără tip (apă rece sau caldă). Apa este singurul consum citit individual.
- **Luna de întreținere**, cu statusurile `DESCHISA` → `CALCULATA` → `APROBATA` → `PUBLICATA` → `INCHISA`:
  1. proprietarii transmit indexul până la ziua-limită (implicit 20);
  2. administratorul introduce facturile furnizorilor;
  3. administratorul rulează calculul (acțiune taxată);
  4. președintele aprobă;
  5. lista se publică.
- **Repartizarea unei facturi** se face după `mod_repartizare` al categoriei: `CONSUM` (după consumul din apometru), `PERSOANE`, `APARTAMENT` (egal), `SUPRAFATA`, `COTA_PARTE`.
  - Se lucrează în bani: rotunjire în jos, iar banii rămași se dau apartamentelor cu cea mai mare parte fracționară.
  - Suma detaliilor trebuie să fie exact suma facturii. Funcția `repartizeaza` din `prisma/seed.ts` face asta corect: mut-o într-un modul comun când implementezi calculul în aplicație.
- **Citirile**: indexul nou trebuie să fie mai mare sau egal cu cel anterior. Un consum de peste 3 ori media se salvează nevalidat, pentru verificare. Lipsa citirii se completează `ESTIMAT`.
- **Plățile** se alocă automat pe cele mai vechi fișe neachitate (`alocari_plati`). Restanța neachitată trece în `restanta_anterioara` a lunii următoare.
- **Penalizările** se aplică după 30 de zile de la scadență, cu 0,2% pe zi (configurabil per asociație), fără a depăși suma datorată.

## Convenții

- Textul afișat utilizatorului este în română, cu diacritice. Identificatorii din cod sunt în română, fără diacritice (`calculeazaLuna`, `soldDupa`), la fel ca în schemă.
- Datele de test sunt fictive. Domeniile de email sunt `.test`, iar parola tuturor conturilor de test este `parola123`. Nu folosi date reale.
- Parolele se salvează doar ca hash. Seed-ul folosește `scrypt` din `node:crypto`; păstrează același format (`scrypt$salt$hash`) și la autentificare.
- Nu publica `.env`. Pentru variabile noi, actualizează `.env.example`.
- Nu adăuga dependențe mari fără motiv; preferă ce oferă deja Next, Prisma și Node.

## Stadiul proiectului

**Gata:**
- Laboratorul 2: schema completă, migrarea inițială, seed cu 3 asociații (Florilor 12 pe Pro activ, Parcul Verde pe Free, Mărăști 7 pe Max suspendat până la plată), pagina de test `/`;
- Laboratorul 3: proiectul `orm-dbfirst` (modele generate din baza de date, clase Accessor, consolă de test), coloana `planuri.descriere` și tabelul `cupoane_reducere`, afișate pe pagina `/`;
- Laboratorul 4: proiectul `orm-codefirst` (baza de date creată din modele prin migrări, seed, Accessori, eager/lazy loading) și, în aplicație, `planuri.pret_anual`, `planuri.recomandat`, procentul zecimal al cupoanelor și tabelul `facturi_simulate`, afișate pe pagina `/`;
- Laboratorul 5: aplicația MVC `orm-codefirst/web-mvc` pentru cupoane (Index, Details, Create, Edit);
- Laboratorul 6: abonamente în `web-mvc` (Index, Create): crearea abonamentului emite comanda simulată și aplică cuponul;
- Laboratorul 7: API-ul `orm-codefirst/web-api` pentru cupoane (Get, Get(id), Post, Put), cu DTO-uri și AutoMapper;
- Laboratorul 8: pagina de administrare `web-api/public/admin/cupoane.html` (CRUD complet prin API, inclusiv DELETE și restaurare; legată din meniul admin, nu din secțiunea de utilizator) și publicarea pe IIS: copia din `C:\BlockManager\aplicatie` rulează cu pm2 (`publicare/ecosystem.config.cjs`), iar IIS (URL Rewrite + ARR, `publicare/iis/*/web.config`) o servește pe `http://proiect-mvc-demo.com` (MVC) și `http://proiect-api-demo.com` (API), nume trecute în fișierul hosts. `GET /api/config` dă pagina de utilizator adresa admin-ului (`ADRESA_ADMIN`);
- Laboratorul 9: ștergere fizică pentru `Notificare` (`/notificari` în admin) și ștergere logică pentru `PachetTokeni` (`/pachete`, coloana `pachete_tokeni.sters_la`, migrările `20261123160000` și `20261123160100`); livrabil în `laboratoare/laborator9`;
- Laboratorul 10: interfețe pentru servicii (`servicii/src/contracte.ts`), controllere create pe cerere în scope-ul DI, durata de viață configurabilă (`DURATA_VIATA_SERVICII`) și pagina `/di`; livrabil în `laboratoare/laborator10`;
- Proiectul final, în `orm-codefirst`: nivelul Services (plată simulată, alocare și debitare tokeni, upgrade/downgrade, pachete, cupoane, job zilnic), DI, cache, loguri, ștergere logică, evenimente cu 3 consumatori, admin CRUD complet, secțiunea de utilizator prin API, documentația finală (`laboratoare/proiect`).

**Posibile extinderi (nu sunt cerute de grilă):**
1. autentificarea cu roluri (acum secțiunea de utilizator alege asociația dintr-o listă);
2. calculul real al întreținerii ca acțiune taxată (acum acțiunea doar debitează tokenii);
3. transmiterea indexului de către proprietari.
