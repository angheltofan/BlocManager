/**
 * WebMVC: sectiunea de administrare BlockManager (Express + EJS), pe portul 3001.
 *
 *   Modele       src/models/CuponViewModel.ts, src/models/AbonamentViewModel.ts
 *   Controllere  src/controllers/CupoaneController.ts, src/controllers/AbonamenteController.ts
 *   View-uri     views/cupoane/*.ejs, views/abonamente/*.ejs
 *
 * Controllerele primesc serviciile din containerul de dependency injection (proiectul Servicii).
 * Sirul de conexiune (DATABASE_URL) si portul (PORT) sunt in fisierul .env al proiectului,
 * echivalentul sectiunii connectionStrings din web.config.
 */
import "dotenv/config";
import express, { type NextFunction, type Request, type Response } from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { inchideContext } from "repository-codefirst";
import { creeazaContainer, EroareBusiness, type Container, type Dependente } from "servicii";
import { AbonamenteController } from "./controllers/AbonamenteController.ts";
import { AsociatiiController } from "./controllers/AsociatiiController.ts";
import { CupoaneController } from "./controllers/CupoaneController.ts";
import { DiController } from "./controllers/DiController.ts";
import { NotificariController } from "./controllers/NotificariController.ts";
import { PacheteController } from "./controllers/PacheteController.ts";

const radacina = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.PORT ?? 3001);
const container = creeazaContainer("admin-mvc");
const { logger, magistralaEvenimente } = container.cradle;

const app = express();
app.set("view engine", "ejs");
app.set("views", path.join(radacina, "views"));
app.locals.adresaUtilizator = process.env.ADRESA_UTILIZATOR ?? "http://localhost:3002";
app.use(express.urlencoded({ extended: false })); // corpul formularelor POST
app.use(express.static(path.join(radacina, "public")));

// logul fiecarei cereri HTTP (metoda, adresa, status, durata)
app.use((req, res, next) => {
  // paginile admin arata date care se schimba: nu se pastreaza in cache (browser sau proxy-ul IIS)
  if (!req.path.endsWith(".css")) res.set("Cache-Control", "no-store");
  const start = Date.now();
  res.on("finish", () => {
    if (!req.path.endsWith(".css")) logger.info(`${req.method} ${req.originalUrl}`, { status: res.statusCode, ms: Date.now() - start });
  });
  next();
});

// Laboratorul 10: un scope DI pentru fiecare cerere HTTP. Controllerul este creat la fiecare cerere, in scope-ul
// ei, deci primeste serviciile dupa durata de viata aleasa (DURATA_VIATA_SERVICII: singleton, scoped, transient).
app.use((_req, res, next) => {
  res.locals.scope = container.createScope();
  next();
});
function controller<C extends object>(Clasa: new (dep: Dependente) => C): C {
  return new Proxy({} as C, {
    get: (_t, actiune) => (req: Request, res: Response, next: NextFunction) => {
      const c = new Clasa((res.locals.scope as Container).cradle) as Record<string | symbol, unknown>;
      return (c[actiune] as (req: Request, res: Response, next: NextFunction) => unknown)(req, res, next);
    },
  });
}

// Rutele: fiecare URL este legat de o actiune a unui controller
const cupoane = controller(CupoaneController);
app.get("/", (_req, res) => res.redirect("/abonamente"));
app.get("/cupoane", cupoane.index);
app.get("/cupoane/create", cupoane.createGet);
app.post("/cupoane/create", cupoane.createPost);
app.get("/cupoane/edit/:id", cupoane.editGet);
app.post("/cupoane/edit/:id", cupoane.editPost);
app.get("/cupoane/delete/:id", cupoane.deleteGet);
app.post("/cupoane/delete/:id", cupoane.deletePost);
app.post("/cupoane/restore/:id", cupoane.restorePost);
app.get("/cupoane/:id", cupoane.details);

const abonamente = controller(AbonamenteController);
app.get("/abonamente", abonamente.index);
app.get("/abonamente/create", abonamente.createGet);
app.post("/abonamente/create", abonamente.createPost);
app.post("/abonamente/job", abonamente.jobPost);
app.get("/abonamente/edit/:id", abonamente.editGet);
app.post("/abonamente/edit/:id", abonamente.editPost);
app.get("/abonamente/delete/:id", abonamente.deleteGet);
app.post("/abonamente/delete/:id", abonamente.deletePost);
app.get("/abonamente/:id", abonamente.details);

// Asociatiile (clientii): o asociatie noua poate primi apoi un abonament
const asociatii = controller(AsociatiiController);
app.get("/asociatii", asociatii.index);
app.get("/asociatii/create", asociatii.createGet);
app.post("/asociatii/create", asociatii.createPost);

// Laboratorul 9, exercitiul 2: stergere logica (pachetele sunt referite de comenzi_simulate)
const pachete = controller(PacheteController);
app.get("/pachete", pachete.index);
app.get("/pachete/delete/:id", pachete.deleteGet);
app.post("/pachete/delete/:id", pachete.deletePost);
app.post("/pachete/restore/:id", pachete.restorePost);
app.get("/pachete/:id", pachete.details);

// Laboratorul 9, exercitiul 1: stergere fizica (notificarile nu sunt referite de alte tabele)
const notificari = controller(NotificariController);
app.get("/notificari", notificari.index);
app.post("/notificari/citita/:id", notificari.marcheazaCitita);
app.post("/notificari/delete-citite", notificari.deleteCititePost);
app.get("/notificari/delete/:id", notificari.deleteGet);
app.post("/notificari/delete/:id", notificari.deletePost);

// Laboratorul 10, exercitiul 3: durata de viata a obiectelor injectate
const di = controller(DiController);
app.get("/di", di.index);

app.use((_req: Request, res: Response) => {
  res.status(404).render("eroare", { titlu: "Pagină inexistentă", mesaj: "Adresa cerută nu există." });
});
app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof EroareBusiness) {
    return res.status(err.status).render("eroare", { titlu: err.status === 404 ? "Nu există" : "Operație refuzată", mesaj: err.message });
  }
  logger.eroare(`Eroare la ${req.method} ${req.originalUrl}`, { eroare: String(err) });
  res.status(500).render("eroare", {
    titlu: "Eroare la server",
    mesaj: "Nu am putut citi sau salva datele. Verifică dacă PostgreSQL rulează și DATABASE_URL din .env.",
  });
});

const server = app.listen(port, () => {
  logger.info(`Secțiunea de admin: http://localhost:${port}/abonamente`);
});

const opreste = () =>
  server.close(() => void magistralaEvenimente.asteaptaConsumatorii().then(() => inchideContext()).then(() => process.exit(0)));
process.on("SIGINT", opreste);
process.on("SIGTERM", opreste);
