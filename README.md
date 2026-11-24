# BlockManager

Platformă SaaS cu abonament pentru administrarea asociațiilor de proprietari. Nucleul aplicației este **mecanismul de monetizare**: planurile Free, Pro și Max se plătesc lunar (plată simulată), iar acțiunile importante consumă tokeni care se reînnoiesc la fiecare perioadă.

Proiect realizat la disciplina *Proiectarea aplicațiilor web* (PPAW) · Anghel Tofan.

## Unde este aplicația finală

**Aplicația evaluată este soluția [`orm-codefirst`](orm-codefirst/)**. Este organizată pe straturi, ca o soluție .NET cu mai multe proiecte (aici, npm workspaces):

| Proiect | Rol |
| --- | --- |
| `librarie-modele` | entitățile (schema Prisma) și clientul generat |
| `repository-codefirst` | contextul bazei de date, migrările și seed-ul |
| `nivel-acces-date` | clasele Accessor (doar acces la date) |
| `servicii` | **logica de business**: plata simulată, tokeni, upgrade/downgrade, cupoane, job zilnic; DI, cache, loguri, evenimente |
| `web-mvc` | secțiunea de **administrare** (MVC, Express + EJS), http://localhost:3001 |
| `web-api` | **API-ul REST** și secțiunea de **utilizator** („Abonamentul meu”), http://localhost:3002 |

Documentația completă (proiectare, implementare, utilizare): [`laboratoare/proiect/BlockManager_Documentatie.pdf`](laboratoare/proiect/BlockManager_Documentatie.pdf).

## Pornire rapidă (Windows)

Ai nevoie de Node.js 20.19+ și PostgreSQL 16+.

```powershell
cd orm-codefirst
.\instalare.ps1    # pachete, .env, baza de date blockmanager_codefirst, migrari si date de test
.\porneste.ps1     # porneste admin (3001) si API + pagina utilizator (3002)
```

- Administrare: http://localhost:3001/abonamente
- Pagina utilizatorului: http://localhost:3002/
- API: http://localhost:3002/api/planuri (colecția Postman: `orm-codefirst/web-api/BlockManager_API.postman_collection.json`)

Publicarea pe IIS, cu numele de host `proiect-mvc-demo.com` și `proiect-api-demo.com`, se face cu `orm-codefirst\publicare\publica.ps1`, rulat ca Administrator. Detalii în [`orm-codefirst/README.md`](orm-codefirst/README.md).

## Laboratoarele

Livrabilele fiecărui laborator sunt în folderul [`laboratoare`](laboratoare/).

| Lab | Tema | Unde în cod | Livrabil |
| --- | --- | --- | --- |
| 1 | Entități, diagrame UML, structura bazei de date | – | `laboratoare/laborator1` |
| 2 | Baza de date și aplicația de test | `prisma/`, `src/` (rădăcina) | `laboratoare/laborator2` |
| 3 | ORM Database First | `orm-dbfirst/` | `laboratoare/laborator3` |
| 4 | ORM Code First, clase Accessor, eager/lazy loading | `orm-codefirst/` | `laboratoare/laborator4` |
| 5 | MVC: Index, Details, Create, Edit (cupoane) | `orm-codefirst/web-mvc` | `laboratoare/laborator5` |
| 6 | MVC complex: entitate cu cheie străină (abonamente) | `orm-codefirst/web-mvc` | `laboratoare/laborator6` |
| 7 | Web API: Get, Post, Put, DTO-uri, AutoMapper, Postman | `orm-codefirst/web-api` | `laboratoare/laborator7` |
| 8 | Front-end pentru API și publicare pe IIS | `web-api/public/admin`, `orm-codefirst/publicare` | `laboratoare/laborator8` |
| 9 | Ștergere fizică (notificări) și logică (pachete) | `orm-codefirst/web-mvc`, `nivel-acces-date` | `laboratoare/laborator9` |
| Proiect | Services, DI, cache, loguri, evenimente, documentație | `orm-codefirst/servicii` | `laboratoare/proiect` |

## Regulile de monetizare, pe scurt

| Plan | Preț simulat | Tokeni / lună |
| --- | --- | --- |
| Free | 0 lei | 50 |
| Pro | 49 lei / lună | 400 |
| Max | 149 lei / lună | 2000 |

- Pro și Max sunt **suspendate până la plată**. La finalul perioadei, jobul zilnic emite comanda lunii următoare și suspendă abonamentul.
- Acțiunile taxate (calcul întreținere 10, recalculare 5, notificări 5, export PDF 2, raport anual 15 tokeni) consumă întâi tokenii planului, apoi pe cei extra, cumpărați în pachete.
- Fiecare plată simulată emite o factură (TVA 21%), o notificare și o înregistrare de audit, prin evenimentul `PlataEfectuata` cu 3 consumatori.
- Plata este **doar simulată**: nu există procesator de plăți și nu se colectează date de card.

## Aplicația de test din rădăcină (Laboratorul 2)

Rădăcina repository-ului conține baza de date din Laboratorul 2 (`blockmanager`) și o pagină de test Next.js 16 care afișează date din tabele.

```bash
npm install
createdb -h localhost -U postgres blockmanager
# copiaza .env.example in .env si completeaza parola in DATABASE_URL
npm run db:migrate
npm run db:seed
npm run dev        # http://localhost:3000
```

## Date de test

Toate datele sunt fictive, iar conturile au parola `parola123`. În aplicația finală, administratorii asociațiilor sunt de forma `admin.florilor@blockmanager.test`, iar asociațiile de test sunt Florilor 12 (Pro activ), Parcul Verde (Free), Mărăști 7 și Zorilor 3.
