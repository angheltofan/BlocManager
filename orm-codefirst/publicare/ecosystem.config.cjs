// pm2: cele doua aplicatii Node publicate, pornite in fundal si repornite automat daca se opresc.
// Fiecare citeste .env din folderul ei (web-mvc/.env, web-api/.env).
// TypeScript-ul ruleaza cu "node --import tsx": un singur proces Node, pornit de pm2 fara fereastra de consola.
// (CLI-ul tsx porneste un al doilea proces, care pe Windows ar deschide cate o fereastra de terminal.)
const path = require("node:path");

const radacina = path.resolve(__dirname, "..");
const aplicatie = (nume, folder) => ({
  name: nume,
  cwd: path.join(radacina, folder),
  script: path.join(radacina, folder, "src", "server.ts"),
  interpreter: "node",
  node_args: ["--import", "tsx"],
  env: { NODE_ENV: "production", LOG_CONSOLA: "nu" },
  autorestart: true,
  max_restarts: 10,
  restart_delay: 3000,
  time: true,
});

module.exports = {
  apps: [aplicatie("blockmanager-mvc", "web-mvc"), aplicatie("blockmanager-api", "web-api")],
};
