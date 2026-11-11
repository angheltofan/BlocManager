# DemoORM_CodeFirst (BlockManager, Laborator 4)

Proiect separat de aplicatia web, organizat ca o solutie cu patru proiecte (npm workspaces).
Baza de date `blockmanager_codefirst` este creata din modele, prin migrari.

| Proiect | Echivalent .NET | Continut |
| --- | --- | --- |
| `librarie-modele` | LibrarieModele | modelele (entitatile) in `prisma/schema/*.prisma`, cu chei primare si straine; clientul generat in `src/generated/prisma` |
| `repository-codefirst` | Repository_CodeFirst | `BlockManagerContext` (derivat din PrismaClient, ca DbContext), `prisma.config.ts` (sirul de conexiune din `.env`), migrarile si seed-ul |
| `nivel-acces-date` | NivelAccesDate (fost NivelAccesDate_DBFirst) | `PlanuriAccessor`, `AbonamenteAccessor`, `CupoaneAccessor` |
| `test-console-codefirst` | aplicatia consola | afiseaza datele si compara eager / lazy loading |
| `web-mvc` | proiectul Web MVC (Laboratorul 5) | Express + EJS: `CuponViewModel`, `CupoaneController` (Index, Details, Create, Edit), view-urile din `views/cupoane` |

## Comenzi (din `orm-codefirst`)

```
npm install                                   # instaleaza pachetele si genereaza clientul
npm run migrate:dev                           # aplica migrarile pe baza de date (o creeaza, daca lipseste)
npm run migrate:dev -- --name <nume>          # migrare noua, dupa o modificare in librarie-modele/prisma/schema
npm run db:seed                               # datele de test din seed (planuri, cupoane_reducere)
npm start                                     # aplicatia consola
npm run typecheck                             # verificarea tipurilor in toate proiectele
npm run web                                   # aplicatia web MVC, http://localhost:3001/cupoane
```

## Migrari

1. `20261110150000_init`: creeaza toate tabelele, cheile primare, cheile straine si indecsii.
2. `20261110150100_date_test`: insereaza planurile FREE, PRO si cupoanele BUNVENIT20, TOAMNA10.
3. `20261110160000_modificari_planuri_cupoane_facturi`: `planuri.pret_anual`, `planuri.recomandat`,
   `cupoane_reducere.procent_reducere` din INTEGER in DECIMAL(5,2) si tabelul nou `facturi_simulate`.

Seed-ul ruleaza dupa migrari (`prisma db seed`): gaseste randurile migrarii si le actualizeaza, apoi adauga MAX, MAX15 si VARA5.

## Eager / lazy loading

Setarea `INCARCARE_RELATII` din `.env` (`eager` sau `lazy`) alege cum se incarca relatia Plan -> CuponReducere
in `PlanuriAccessor.getCuCupoane()`:

- `eager`: planurile si cupoanele se citesc odata (`include`), cu 2 interogari SQL;
- `lazy`: se citesc doar planurile; cupoanele unui plan se citesc la primul acces, cu cate o interogare pe plan (1 + N).

## Aplicatia web MVC (Laboratorul 5)

`web-mvc` foloseste NivelAccesDate si LibrarieModele. Sirul de conexiune este in `web-mvc/.env`
(`DATABASE_URL`, echivalentul `connectionStrings` din `web.config`), impreuna cu `PORT`.

| Ruta | Actiune | Accessor |
| --- | --- | --- |
| `GET /cupoane` | Index | `CupoaneAccessor.getToate()` |
| `GET /cupoane/:id` | Details | `CupoaneAccessor.getDupaId()` |
| `GET /cupoane/create` | Create (formular gol) | `PlanuriAccessor.getToate()` pentru lista de selectie |
| `POST /cupoane/create` | Create (salvare) | `CupoaneAccessor.adauga()` (AddEntity) |
| `GET /cupoane/edit/:id` | Edit (formular completat) | `CupoaneAccessor.getDupaId()` |
| `POST /cupoane/edit/:id` | Edit (salvare) | `CupoaneAccessor.modifica()` (UpdateEntity) |
