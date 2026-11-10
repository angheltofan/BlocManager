# orm-dbfirst – BlockManager, Database First (Laborator 3)

Modelele sunt generate din baza de date existentă `blockmanager` cu Prisma (`prisma db pull`), echivalentul „EF Designer from database” din Entity Framework.

| Proiect (EF / .NET) | Aici |
| --- | --- |
| `Repository_DBFirst` (EDMX + DbContext) | `repository-dbfirst/`: `prisma/schema.prisma` obținut prin introspecție și clientul generat în `src/generated/prisma` (`PrismaClient` = DbContext) |
| `NivelAccesDate_DBFirst` | `nivel-acces-date-dbfirst/`: `PlanuriAccessor`, `AbonamenteAccessor` |
| `TestORM_SchemaFirst` (consolă + app.config) | `test-orm-schemafirst/`: `src/main.ts`, cu conexiunea în `.env` |
| scripturi de modificare a bazei | `sql/01_ex3_planuri_descriere.sql`, `sql/02_ex4_cupoane_reducere.sql` |

## Comenzi (din acest folder)

```powershell
npm install                 # instalează pachetele și generează clientul
npm run db:pull             # citește baza de date și rescrie repository-dbfirst/prisma/schema.prisma
npm run generate            # generează modelele și PrismaClient din schema
npm start                   # rulează aplicația consolă de test
npm run typecheck           # verifică tipurile din cele trei proiecte
```

Înainte de prima rulare, copiază `.env.example` în `.env` atât în `repository-dbfirst`, cât și în `test-orm-schemafirst`, și pune parola în `DATABASE_URL`. Cele două fișiere au același conținut.

După orice modificare a bazei de date („Update Model from Database”), rulezi `npm run db:pull` și `npm run generate`.
