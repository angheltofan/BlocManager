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
import { creeazaContainer, EroareBusiness } from "servicii";
import { AbonamenteController } from "./controllers/AbonamenteController.ts";
import { CupoaneController } from "./controllers/CupoaneController.ts";

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
  const start = Date.now();
  res.on("finish", () => {
    if (!req.path.endsWith(".css")) logger.info(`${req.method} ${req.originalUrl}`, { status: res.statusCode, ms: Date.now() - start });
  });
  next();
});

// Rutele: fiecare URL este legat de o actiune a unui controller
const cupoane = new CupoaneController(container.cradle);
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

const abonamente = new AbonamenteController(container.cradle);
app.get("/abonamente", abonamente.index);
app.get("/abonamente/create", abonamente.createGet);
app.post("/abonamente/create", abonamente.createPost);
app.post("/abonamente/job", abonamente.jobPost);
app.get("/abonamente/edit/:id", abonamente.editGet);
app.post("/abonamente/edit/:id", abonamente.editPost);
app.get("/abonamente/delete/:id", abonamente.deleteGet);
app.post("/abonamente/delete/:id", abonamente.deletePost);
app.get("/abonamente/:id", abonamente.details);

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
