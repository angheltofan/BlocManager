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
orm-codefirst/              Laboratoarele 4-7: proiect separat Code First + aplicația MVC web-mvc + API-ul web-api (npm workspaces), vezi mai jos
laboratoare/                livrabilele predate la fiecare laborator (PDF-uri, backup-uri); nu fac parte din aplicație
```

### orm-dbfirst (Laborator 3, Database First)

Proiect separat de aplicația web, cu `package.json` și `node_modules` proprii. Este exclus din `tsconfig.json` și din ESLint-ul aplicației.

- `repository-dbfirst/`: modelele generate din baza de date cu `npx prisma db pull` + `npx prisma generate`. Numele sunt cele din baza de date (`planuri`, `pret_lunar`). Codul din `src/generated/prisma` este generat, dar e păstrat în Git, pentru că e livrabil. Singura modificare manuală din schema introspectată este redenumirea relației `fise_intretinere.penalizari_lista` (coloana `penalizari` are același nume); Prisma o păstrează la următoarele `db pull`.
- `nivel-acces-date-dbfirst/`: `PlanuriAccessor`, `AbonamenteAccessor`.
- `test-orm-schemafirst/`: aplicația consolă (`npm start` din `orm-dbfirst`).
- `sql/`: scripturile cu care s-a modificat baza de date la Laboratorul 3 (coloana `planuri.descriere`, tabelul `cupoane_reducere`). Aceleași schimbări există în aplicație ca migrări, marcate aplicate cu `prisma migrate resolve --applied`.

Aplicația web rămâne Schema First: modificările ei de bază de date se fac prin migrări (`prisma migrate dev`). După o migrare nouă, `orm-dbfirst` se actualizează cu `npm run db:pull` și `npm run generate`, rulate din `orm-dbfirst`.

### orm-codefirst (Laboratoarele 4-7: Code First, MVC și API)

Proiect separat (Laboratoarele 4-7), cu `package.json` și `node_modules` proprii, exclus din `tsconfig.json` și din ESLint-ul aplicației. Folosește o bază de date separată, `blockmanager_codefirst`, creată doar din migrări.

- `librarie-modele/`: modelele (schema Prisma împărțită pe domenii, în `prisma/schema/*.prisma`) și clientul generat în `src/generated/prisma` (nu se editează).
- `repository-codefirst/`: `BlockManagerContext` (clasă derivată din `PrismaClient`, cu contor de interogări și setarea `INCARCARE_RELATII`), `prisma.config.ts`, migrările (`init`, `date_test`, `modificari_planuri_cupoane_facturi`, `date_asociatii_abonamente`) și `prisma/seed.ts` (doar `planuri` și `cupoane_reducere`).
- `nivel-acces-date/`: `PlanuriAccessor` (inclusiv eager/lazy pentru cupoane), `AbonamenteAccessor` (inclusiv `getToateCuDetalii`, `getAsociatiiFaraAbonamentCurent`, `creeaza`), `CupoaneAccessor` (inclusiv `getDupaId`, `adauga`, `modifica`).
- `test-console-codefirst/`: aplicația consolă (`npm start` din `orm-codefirst`).
- `web-mvc/` (Laborator 5): aplicație web MVC cu Express + EJS pentru cupoanele de reducere (Index, Details, Create, Edit), pe portul 3001 (`npm run web` din `orm-codefirst`). Model: `src/models/CuponViewModel.ts` (conversii entitate/formular și validare), controller: `src/controllers/CupoaneController.ts`, view-uri: `views/`. Scrie doar prin `CupoaneAccessor.adauga` / `modifica`. Formularele se validează pe server; un checkbox nebifat lipsește din corpul cererii, deci înseamnă `false`.
  - Laborator 6: abonamente (Index, Create), `AbonamentViewModel` + `AbonamenteController`. `AbonamenteAccessor.creeaza` respectă regulile de monetizare într-o tranzacție: o asociație are cel mult un abonament curent; Free pornește `ACTIV`; Pro/Max pornesc `SUSPENDAT` cu o comandă `IN_ASTEPTARE` (`SIM-AAAA-NNNNNN`), redusă de un cupon valabil, a cărui utilizare se numără cu o actualizare condiționată.
- `web-api/` (Laborator 7): API REST cu Express pentru cupoane, pe portul 3002 (`npm run api` din `orm-codefirst`): `GET /api/cupoane`, `GET /api/cupoane/:id`, `POST /api/cupoane`, `PUT /api/cupoane/:id`. Răspunde cu `CuponDto` (nu cu entitatea); body-ul POST/PUT este `CuponInputDto`, cu planul dat prin cod (`planCod`). Conversiile le face AutoMapper (`@automapper/core` + `@automapper/pojos` 8.8.1) în `src/mapare/mapper.ts`. Coduri: 400 cu `erori` pe câmpuri, 404, 409 pentru cod duplicat, 201 + `Location` la POST. Colecția Postman e în `web-api/`.

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
8. **Cupoanele de reducere** (`cupoane_reducere`) reduc prețul unei comenzi simulate de abonament cu `procent_reducere` (zecimal, de exemplu 7,50%). Un cupon e valabil doar dacă e `activ`, nu a trecut de `valabil_pana`, `utilizari < utilizari_maxime` și, când are `plan_id`, doar pentru acel plan. În `web-mvc` (Laboratorul 6) se aplică deja la emiterea comenzii; în aplicația Next încă nu.
9. **Facturile simulate** (`facturi_simulate`): fiecare comandă `ACHITATA` are o factură (relație 1:1), cu numărul `BM-AAAA-NNNNNN`, data plății, subtotal, TVA 21% și total; suma comenzii include TVA. La plata simulată, factura se creează în aceeași tranzacție.
10. **Planurile** au și `pret_anual` (null = fără plată anuală) și `recomandat` (planul evidențiat pe pagina de prețuri).
11. **Pachetele de tokeni** (`pachete_tokeni`: 100 tokeni / 19 lei, 300 / 49, 1000 / 129) se cumpără tot prin comandă simulată. Adaugă la `tokeni_extra`, nu expiră și se consumă după tokenii planului.
12. **Upgrade** (de exemplu Free → Pro): comandă cu prețul noului plan. După plată, abonamentul vechi devine `EXPIRAT`, se creează unul nou `ACTIV` pentru o lună, tokenii de plan vechi expiră și se alocă cei ai noului plan.
13. **Downgrade**: se salvează `plan_urmator_id`, fără plată acum. Jobul zilnic aplică planul la finalul perioadei. Dacă asociația depășește limitele noului plan, datele rămân, dar nu se mai pot adăuga apartamente sau blocuri.
14. **Limitele planului** (`max_apartamente`, `max_blocuri`) se verifică la fiecare adăugare de apartament sau bloc.
15. **Jurnalul este sursa de adevăr.** Orice schimbare a soldului (`ALOCARE`, `CONSUM`, `CUMPARARE`, `EXPIRARE`, `BONUS`) scrie un rând în `tranzactii_tokeni`. Nu actualiza niciodată `portofele_tokeni` fără rândul corespunzător. Invariant: soldul din portofel = ultimul `sold_dupa` = suma câmpului `cantitate`.

Pune toată logica de tokeni și abonament într-un singur modul de servicii (de exemplu `src/lib/monetizare/`), apelat de toate acțiunile taxate. Nu o copia în pagini.

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
- Laboratorul 7: API-ul `orm-codefirst/web-api` pentru cupoane (Get, Get(id), Post, Put), cu DTO-uri și AutoMapper.

**Următorii pași:**
1. autentificarea cu roluri;
2. modulul de servicii pentru tokeni și abonament (debitare, plată simulată, pachete, upgrade și downgrade);
3. jobul zilnic (reînnoire Free, suspendare Pro/Max, aplicarea downgrade-urilor);
4. paginile „Abonament” și „Planuri”;
5. calculul întreținerii ca acțiune taxată;
6. transmiterea indexului.
