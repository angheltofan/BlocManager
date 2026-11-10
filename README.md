# BlockManager

Platformă SaaS cu abonament pentru administrarea asociațiilor de proprietari. Planurile Free, Pro și Max se plătesc lunar (plată simulată), iar acțiunile importante consumă tokeni care se reînnoiesc la fiecare perioadă.

Acest proiect conține baza de date (Laborator 2) și o aplicație de test care se conectează la ea și afișează date din tabele.

## Tehnologii

- Next.js 16 (React 19, TypeScript, Tailwind CSS)
- PostgreSQL 16
- Prisma ORM 7 cu adaptorul `@prisma/adapter-pg`

## Pornire

Ai nevoie de Node.js 20.19+ (recomandat 22 LTS) și PostgreSQL 16.

1. Instalează pachetele (generează și clientul Prisma):

   ```bash
   npm install
   ```

2. Creează baza de date goală `blockmanager` (din pgAdmin sau din linia de comandă):

   ```bash
   createdb -h localhost -U postgres blockmanager
   ```

3. Copiază `.env.example` în `.env` și pune parola ta de PostgreSQL în `DATABASE_URL`:

   ```
   DATABASE_URL="postgresql://postgres:PAROLA_TA@localhost:5432/blockmanager?schema=public"
   ```

4. Creează tabelele (aplică migrarea din `prisma/migrations`) și populează-le cu date de test:

   ```bash
   npm run db:migrate
   npm run db:seed
   ```

5. Pornește aplicația și deschide http://localhost:3000:

   ```bash
   npm run dev
   ```

Pagina afișează versiunea serverului PostgreSQL, numărul de înregistrări, planurile de abonament, situația fiecărei asociații (plan, stare, tokeni) și ultimele mișcări de tokeni.

## Structura

```
prisma/
  schema.prisma          modelul bazei de date (30 de tabele, 15 enumerări)
  migrations/            migrarea inițială (SQL generat de Prisma)
  seed.ts                datele de test
prisma.config.ts         configurarea Prisma (adresa bazei de date, seed)
src/lib/prisma.ts        clientul Prisma folosit de aplicație
src/app/page.tsx         pagina de test
```

## Comenzi utile

| Comandă | Ce face |
| --- | --- |
| `npm run db:migrate` | aplică migrările pe baza de date (`prisma migrate deploy`) |
| `npm run db:seed` | golește tabelele și inserează din nou datele de test |
| `npm run db:studio` | deschide Prisma Studio, pentru a vedea și edita datele în browser |
| `npx prisma migrate dev --name <nume>` | creează o migrare nouă după o modificare în `schema.prisma` |

## Laborator 3: Database First

Folderul `orm-dbfirst` conține proiectul separat în care modelele sunt generate din baza de date (`prisma db pull`), plus clasele Accessor și o aplicație consolă de test. Detaliile sunt în `orm-dbfirst/README.md`.

## Laborator 4: Code First

Folderul `orm-codefirst` conține proiectul separat în care baza de date `blockmanager_codefirst` este creată din modele, prin migrări. Detaliile sunt în `orm-codefirst/README.md`.

Modificările de model din Laboratorul 4 există și în aplicația web, prin migrarea `20261110160100_modificari_planuri_cupoane_facturi`: prețul anual și eticheta „Recomandat” la planuri, procentul zecimal al cupoanelor și tabelul `facturi_simulate`, toate afișate pe pagina `/`.

## Date de test

Toate datele sunt fictive. Conturile au parola `parola123`, de exemplu:

| Email | Rol | Asociație |
| --- | --- | --- |
| admin@florilor12.test | Administrator | Florilor 12, plan Pro activ |
| admin@parculverde.test | Administrator | Parcul Verde, plan Free |
| admin@marasti7.test | Administrator | Mărăști 7, plan Max suspendat până la plată |
