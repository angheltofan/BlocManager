-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'PRESEDINTE', 'PROPRIETAR');

-- CreateEnum
CREATE TYPE "SursaCitire" AS ENUM ('PROPRIETAR', 'ADMIN', 'ESTIMAT');

-- CreateEnum
CREATE TYPE "ModRepartizare" AS ENUM ('COTA_PARTE', 'PERSOANE', 'CONSUM', 'APARTAMENT', 'SUPRAFATA');

-- CreateEnum
CREATE TYPE "StatusLuna" AS ENUM ('DESCHISA', 'CALCULATA', 'APROBATA', 'PUBLICATA', 'INCHISA');

-- CreateEnum
CREATE TYPE "StatusFisa" AS ENUM ('NEPLATITA', 'PARTIAL_PLATITA', 'PLATITA');

-- CreateEnum
CREATE TYPE "MetodaPlata" AS ENUM ('CASIERIE', 'TRANSFER', 'CARD');

-- CreateEnum
CREATE TYPE "StatusPlata" AS ENUM ('INREGISTRATA', 'ANULATA');

-- CreateEnum
CREATE TYPE "TipFond" AS ENUM ('RULMENT', 'REPARATII');

-- CreateEnum
CREATE TYPE "StatusSesizare" AS ENUM ('NOUA', 'IN_LUCRU', 'REZOLVATA');

-- CreateEnum
CREATE TYPE "TipNotificare" AS ENUM ('INTRETINERE', 'PLATA', 'SESIZARE', 'ABONAMENT', 'TOKENI', 'SISTEM');

-- CreateEnum
CREATE TYPE "CodActiune" AS ENUM ('CALCUL', 'RECALCUL', 'NOTIFICARI', 'EXPORT_PDF', 'RAPORT');

-- CreateEnum
CREATE TYPE "StatusAbonament" AS ENUM ('ACTIV', 'SUSPENDAT', 'ANULAT', 'EXPIRAT');

-- CreateEnum
CREATE TYPE "TipTranzactie" AS ENUM ('ALOCARE', 'CONSUM', 'CUMPARARE', 'EXPIRARE', 'BONUS');

-- CreateEnum
CREATE TYPE "TipComanda" AS ENUM ('ABONAMENT', 'PACHET');

-- CreateEnum
CREATE TYPE "StatusComanda" AS ENUM ('IN_ASTEPTARE', 'ACHITATA', 'ANULATA');

-- CreateTable
CREATE TABLE "contoare" (
    "id" SERIAL NOT NULL,
    "apartament_id" INTEGER NOT NULL,
    "serie" TEXT NOT NULL,
    "data_verificare_metrologica" DATE,
    "activ" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "contoare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "citiri_contoare" (
    "id" SERIAL NOT NULL,
    "contor_id" INTEGER NOT NULL,
    "luna_id" INTEGER NOT NULL,
    "introdus_de_id" INTEGER,
    "index" DECIMAL(12,3) NOT NULL,
    "consum" DECIMAL(12,3) NOT NULL,
    "data_citire" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sursa" "SursaCitire" NOT NULL DEFAULT 'PROPRIETAR',
    "validata" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "citiri_contoare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "furnizori" (
    "id" SERIAL NOT NULL,
    "asociatie_id" INTEGER NOT NULL,
    "denumire" TEXT NOT NULL,
    "cui" TEXT NOT NULL,
    "iban" TEXT,

    CONSTRAINT "furnizori_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorii_cheltuieli" (
    "id" SERIAL NOT NULL,
    "asociatie_id" INTEGER NOT NULL,
    "denumire" TEXT NOT NULL,
    "mod_repartizare" "ModRepartizare" NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "categorii_cheltuieli_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "luni_intretinere" (
    "id" SERIAL NOT NULL,
    "asociatie_id" INTEGER NOT NULL,
    "an" INTEGER NOT NULL,
    "luna" INTEGER NOT NULL,
    "status" "StatusLuna" NOT NULL DEFAULT 'DESCHISA',
    "data_limita_citiri" DATE NOT NULL,
    "data_publicare" TIMESTAMP(3),
    "data_scadenta" DATE,
    "aprobat_de_id" INTEGER,

    CONSTRAINT "luni_intretinere_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facturi_furnizori" (
    "id" SERIAL NOT NULL,
    "furnizor_id" INTEGER NOT NULL,
    "luna_id" INTEGER NOT NULL,
    "categorie_id" INTEGER NOT NULL,
    "numar" TEXT NOT NULL,
    "data_emitere" DATE NOT NULL,
    "data_scadenta" DATE NOT NULL,
    "suma" DECIMAL(12,2) NOT NULL,
    "cantitate" DECIMAL(12,3),
    "platita" BOOLEAN NOT NULL DEFAULT false,
    "fisier_url" TEXT,

    CONSTRAINT "facturi_furnizori_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fise_intretinere" (
    "id" SERIAL NOT NULL,
    "luna_id" INTEGER NOT NULL,
    "apartament_id" INTEGER NOT NULL,
    "total_luna_curenta" DECIMAL(12,2) NOT NULL,
    "restanta_anterioara" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "penalizari" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_de_plata" DECIMAL(12,2) NOT NULL,
    "achitat" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "StatusFisa" NOT NULL DEFAULT 'NEPLATITA',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fise_intretinere_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detalii_intretinere" (
    "id" SERIAL NOT NULL,
    "fisa_id" INTEGER NOT NULL,
    "categorie_id" INTEGER NOT NULL,
    "baza_calcul" DECIMAL(12,4) NOT NULL,
    "suma" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "detalii_intretinere_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fonduri" (
    "id" SERIAL NOT NULL,
    "asociatie_id" INTEGER NOT NULL,
    "tip" "TipFond" NOT NULL,
    "sold" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "contributie_lunara" DECIMAL(10,2) NOT NULL DEFAULT 0,

    CONSTRAINT "fonduri_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anunturi" (
    "id" SERIAL NOT NULL,
    "asociatie_id" INTEGER NOT NULL,
    "autor_id" INTEGER NOT NULL,
    "titlu" TEXT NOT NULL,
    "continut" TEXT NOT NULL,
    "important" BOOLEAN NOT NULL DEFAULT false,
    "data_publicare" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anunturi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sesizari" (
    "id" SERIAL NOT NULL,
    "apartament_id" INTEGER NOT NULL,
    "autor_id" INTEGER NOT NULL,
    "titlu" TEXT NOT NULL,
    "descriere" TEXT NOT NULL,
    "status" "StatusSesizare" NOT NULL DEFAULT 'NOUA',
    "raspuns" TEXT,
    "data_creare" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_rezolvare" TIMESTAMP(3),

    CONSTRAINT "sesizari_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificari" (
    "id" SERIAL NOT NULL,
    "utilizator_id" INTEGER NOT NULL,
    "tip" "TipNotificare" NOT NULL,
    "mesaj" TEXT NOT NULL,
    "citita" BOOLEAN NOT NULL DEFAULT false,
    "data_creare" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificari_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "utilizatori" (
    "id" SERIAL NOT NULL,
    "asociatie_id" INTEGER,
    "email" TEXT NOT NULL,
    "parola_hash" TEXT NOT NULL,
    "nume" TEXT NOT NULL,
    "prenume" TEXT NOT NULL,
    "telefon" TEXT,
    "rol" "Rol" NOT NULL DEFAULT 'PROPRIETAR',
    "activ" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "utilizatori_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asociatii" (
    "id" SERIAL NOT NULL,
    "denumire" TEXT NOT NULL,
    "cui" TEXT NOT NULL,
    "adresa" TEXT NOT NULL,
    "iban" TEXT NOT NULL,
    "banca" TEXT,
    "zi_limita_citiri" INTEGER NOT NULL DEFAULT 20,
    "zile_scadenta" INTEGER NOT NULL DEFAULT 20,
    "procent_penalizare_zi" DECIMAL(5,3) NOT NULL DEFAULT 0.2,
    "zile_gratie_penalizare" INTEGER NOT NULL DEFAULT 30,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asociatii_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blocuri" (
    "id" SERIAL NOT NULL,
    "asociatie_id" INTEGER NOT NULL,
    "denumire" TEXT NOT NULL,
    "adresa" TEXT NOT NULL,

    CONSTRAINT "blocuri_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scari" (
    "id" SERIAL NOT NULL,
    "bloc_id" INTEGER NOT NULL,
    "denumire" TEXT NOT NULL,

    CONSTRAINT "scari_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "apartamente" (
    "id" SERIAL NOT NULL,
    "scara_id" INTEGER NOT NULL,
    "numar" TEXT NOT NULL,
    "etaj" INTEGER NOT NULL,
    "suprafata_utila" DECIMAL(8,2) NOT NULL,
    "cota_parte" DECIMAL(7,4) NOT NULL,
    "nr_persoane" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "apartamente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proprietati" (
    "id" SERIAL NOT NULL,
    "apartament_id" INTEGER NOT NULL,
    "utilizator_id" INTEGER NOT NULL,
    "procent_detinere" DECIMAL(5,2) NOT NULL DEFAULT 100,
    "data_inceput" DATE NOT NULL,
    "data_sfarsit" DATE,

    CONSTRAINT "proprietati_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plati" (
    "id" SERIAL NOT NULL,
    "apartament_id" INTEGER NOT NULL,
    "platitor_id" INTEGER,
    "inregistrat_de_id" INTEGER,
    "suma" DECIMAL(12,2) NOT NULL,
    "data_plata" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metoda" "MetodaPlata" NOT NULL,
    "numar_chitanta" TEXT NOT NULL,
    "status" "StatusPlata" NOT NULL DEFAULT 'INREGISTRATA',

    CONSTRAINT "plati_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alocari_plati" (
    "id" SERIAL NOT NULL,
    "plata_id" INTEGER NOT NULL,
    "fisa_id" INTEGER NOT NULL,
    "suma" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "alocari_plati_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "penalizari" (
    "id" SERIAL NOT NULL,
    "fisa_id" INTEGER NOT NULL,
    "data_calcul" DATE NOT NULL,
    "zile_intarziere" INTEGER NOT NULL,
    "suma" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "penalizari_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planuri" (
    "id" SERIAL NOT NULL,
    "cod" TEXT NOT NULL,
    "denumire" TEXT NOT NULL,
    "pret_lunar" DECIMAL(10,2) NOT NULL,
    "tokeni_lunari" INTEGER NOT NULL,
    "max_apartamente" INTEGER,
    "max_blocuri" INTEGER,
    "raport_anual" BOOLEAN NOT NULL DEFAULT false,
    "activ" BOOLEAN NOT NULL DEFAULT true,
    "descriere" VARCHAR(200),

    CONSTRAINT "planuri_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actiuni_taxabile" (
    "id" SERIAL NOT NULL,
    "cod" "CodActiune" NOT NULL,
    "denumire" TEXT NOT NULL,
    "cost_tokeni" INTEGER NOT NULL,

    CONSTRAINT "actiuni_taxabile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "abonamente" (
    "id" SERIAL NOT NULL,
    "asociatie_id" INTEGER NOT NULL,
    "plan_id" INTEGER NOT NULL,
    "plan_urmator_id" INTEGER,
    "inceput_perioada" TIMESTAMP(3) NOT NULL,
    "sfarsit_perioada" TIMESTAMP(3) NOT NULL,
    "status" "StatusAbonament" NOT NULL DEFAULT 'ACTIV',
    "reinnoire_automata" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "abonamente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portofele_tokeni" (
    "id" SERIAL NOT NULL,
    "asociatie_id" INTEGER NOT NULL,
    "tokeni_plan" INTEGER NOT NULL DEFAULT 0,
    "tokeni_extra" INTEGER NOT NULL DEFAULT 0,
    "ultima_resetare" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portofele_tokeni_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tranzactii_tokeni" (
    "id" SERIAL NOT NULL,
    "portofel_id" INTEGER NOT NULL,
    "tip" "TipTranzactie" NOT NULL,
    "cantitate" INTEGER NOT NULL,
    "sold_dupa" INTEGER NOT NULL,
    "actiune_id" INTEGER,
    "comanda_id" INTEGER,
    "utilizator_id" INTEGER,
    "descriere" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tranzactii_tokeni_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pachete_tokeni" (
    "id" SERIAL NOT NULL,
    "denumire" TEXT NOT NULL,
    "tokeni" INTEGER NOT NULL,
    "pret" DECIMAL(10,2) NOT NULL,
    "activ" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "pachete_tokeni_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comenzi_simulate" (
    "id" SERIAL NOT NULL,
    "asociatie_id" INTEGER NOT NULL,
    "utilizator_id" INTEGER,
    "abonament_id" INTEGER,
    "tip" "TipComanda" NOT NULL,
    "plan_id" INTEGER,
    "pachet_id" INTEGER,
    "suma" DECIMAL(10,2) NOT NULL,
    "status" "StatusComanda" NOT NULL DEFAULT 'IN_ASTEPTARE',
    "referinta" TEXT NOT NULL,
    "achitata_la" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comenzi_simulate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cupoane_reducere" (
    "id" SERIAL NOT NULL,
    "cod" VARCHAR(30) NOT NULL,
    "procent_reducere" INTEGER NOT NULL,
    "plan_id" INTEGER,
    "valabil_pana" DATE NOT NULL,
    "utilizari_maxime" INTEGER NOT NULL DEFAULT 1,
    "utilizari" INTEGER NOT NULL DEFAULT 0,
    "activ" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cupoane_reducere_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "contoare_apartament_id_serie_key" ON "contoare"("apartament_id", "serie");

-- CreateIndex
CREATE UNIQUE INDEX "citiri_contoare_contor_id_luna_id_key" ON "citiri_contoare"("contor_id", "luna_id");

-- CreateIndex
CREATE UNIQUE INDEX "furnizori_asociatie_id_cui_key" ON "furnizori"("asociatie_id", "cui");

-- CreateIndex
CREATE UNIQUE INDEX "categorii_cheltuieli_asociatie_id_denumire_key" ON "categorii_cheltuieli"("asociatie_id", "denumire");

-- CreateIndex
CREATE UNIQUE INDEX "luni_intretinere_asociatie_id_an_luna_key" ON "luni_intretinere"("asociatie_id", "an", "luna");

-- CreateIndex
CREATE INDEX "facturi_furnizori_luna_id_idx" ON "facturi_furnizori"("luna_id");

-- CreateIndex
CREATE UNIQUE INDEX "facturi_furnizori_furnizor_id_numar_key" ON "facturi_furnizori"("furnizor_id", "numar");

-- CreateIndex
CREATE INDEX "fise_intretinere_apartament_id_status_idx" ON "fise_intretinere"("apartament_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "fise_intretinere_luna_id_apartament_id_key" ON "fise_intretinere"("luna_id", "apartament_id");

-- CreateIndex
CREATE UNIQUE INDEX "detalii_intretinere_fisa_id_categorie_id_key" ON "detalii_intretinere"("fisa_id", "categorie_id");

-- CreateIndex
CREATE UNIQUE INDEX "fonduri_asociatie_id_tip_key" ON "fonduri"("asociatie_id", "tip");

-- CreateIndex
CREATE INDEX "sesizari_status_idx" ON "sesizari"("status");

-- CreateIndex
CREATE INDEX "notificari_utilizator_id_citita_idx" ON "notificari"("utilizator_id", "citita");

-- CreateIndex
CREATE UNIQUE INDEX "utilizatori_email_key" ON "utilizatori"("email");

-- CreateIndex
CREATE UNIQUE INDEX "asociatii_cui_key" ON "asociatii"("cui");

-- CreateIndex
CREATE UNIQUE INDEX "blocuri_asociatie_id_denumire_key" ON "blocuri"("asociatie_id", "denumire");

-- CreateIndex
CREATE UNIQUE INDEX "scari_bloc_id_denumire_key" ON "scari"("bloc_id", "denumire");

-- CreateIndex
CREATE UNIQUE INDEX "apartamente_scara_id_numar_key" ON "apartamente"("scara_id", "numar");

-- CreateIndex
CREATE INDEX "proprietati_utilizator_id_idx" ON "proprietati"("utilizator_id");

-- CreateIndex
CREATE UNIQUE INDEX "plati_numar_chitanta_key" ON "plati"("numar_chitanta");

-- CreateIndex
CREATE INDEX "plati_apartament_id_data_plata_idx" ON "plati"("apartament_id", "data_plata");

-- CreateIndex
CREATE UNIQUE INDEX "alocari_plati_plata_id_fisa_id_key" ON "alocari_plati"("plata_id", "fisa_id");

-- CreateIndex
CREATE UNIQUE INDEX "penalizari_fisa_id_data_calcul_key" ON "penalizari"("fisa_id", "data_calcul");

-- CreateIndex
CREATE UNIQUE INDEX "planuri_cod_key" ON "planuri"("cod");

-- CreateIndex
CREATE UNIQUE INDEX "actiuni_taxabile_cod_key" ON "actiuni_taxabile"("cod");

-- CreateIndex
CREATE INDEX "abonamente_asociatie_id_status_idx" ON "abonamente"("asociatie_id", "status");

-- CreateIndex
CREATE INDEX "abonamente_status_sfarsit_perioada_idx" ON "abonamente"("status", "sfarsit_perioada");

-- CreateIndex
CREATE UNIQUE INDEX "portofele_tokeni_asociatie_id_key" ON "portofele_tokeni"("asociatie_id");

-- CreateIndex
CREATE INDEX "tranzactii_tokeni_portofel_id_created_at_idx" ON "tranzactii_tokeni"("portofel_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "comenzi_simulate_referinta_key" ON "comenzi_simulate"("referinta");

-- CreateIndex
CREATE INDEX "comenzi_simulate_asociatie_id_created_at_idx" ON "comenzi_simulate"("asociatie_id", "created_at");

-- CreateIndex
CREATE INDEX "comenzi_simulate_status_idx" ON "comenzi_simulate"("status");

-- CreateIndex
CREATE UNIQUE INDEX "cupoane_reducere_cod_key" ON "cupoane_reducere"("cod");

-- AddForeignKey
ALTER TABLE "contoare" ADD CONSTRAINT "contoare_apartament_id_fkey" FOREIGN KEY ("apartament_id") REFERENCES "apartamente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citiri_contoare" ADD CONSTRAINT "citiri_contoare_contor_id_fkey" FOREIGN KEY ("contor_id") REFERENCES "contoare"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citiri_contoare" ADD CONSTRAINT "citiri_contoare_luna_id_fkey" FOREIGN KEY ("luna_id") REFERENCES "luni_intretinere"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citiri_contoare" ADD CONSTRAINT "citiri_contoare_introdus_de_id_fkey" FOREIGN KEY ("introdus_de_id") REFERENCES "utilizatori"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "furnizori" ADD CONSTRAINT "furnizori_asociatie_id_fkey" FOREIGN KEY ("asociatie_id") REFERENCES "asociatii"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categorii_cheltuieli" ADD CONSTRAINT "categorii_cheltuieli_asociatie_id_fkey" FOREIGN KEY ("asociatie_id") REFERENCES "asociatii"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "luni_intretinere" ADD CONSTRAINT "luni_intretinere_asociatie_id_fkey" FOREIGN KEY ("asociatie_id") REFERENCES "asociatii"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "luni_intretinere" ADD CONSTRAINT "luni_intretinere_aprobat_de_id_fkey" FOREIGN KEY ("aprobat_de_id") REFERENCES "utilizatori"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturi_furnizori" ADD CONSTRAINT "facturi_furnizori_furnizor_id_fkey" FOREIGN KEY ("furnizor_id") REFERENCES "furnizori"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturi_furnizori" ADD CONSTRAINT "facturi_furnizori_luna_id_fkey" FOREIGN KEY ("luna_id") REFERENCES "luni_intretinere"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturi_furnizori" ADD CONSTRAINT "facturi_furnizori_categorie_id_fkey" FOREIGN KEY ("categorie_id") REFERENCES "categorii_cheltuieli"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fise_intretinere" ADD CONSTRAINT "fise_intretinere_luna_id_fkey" FOREIGN KEY ("luna_id") REFERENCES "luni_intretinere"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fise_intretinere" ADD CONSTRAINT "fise_intretinere_apartament_id_fkey" FOREIGN KEY ("apartament_id") REFERENCES "apartamente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalii_intretinere" ADD CONSTRAINT "detalii_intretinere_fisa_id_fkey" FOREIGN KEY ("fisa_id") REFERENCES "fise_intretinere"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalii_intretinere" ADD CONSTRAINT "detalii_intretinere_categorie_id_fkey" FOREIGN KEY ("categorie_id") REFERENCES "categorii_cheltuieli"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fonduri" ADD CONSTRAINT "fonduri_asociatie_id_fkey" FOREIGN KEY ("asociatie_id") REFERENCES "asociatii"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anunturi" ADD CONSTRAINT "anunturi_asociatie_id_fkey" FOREIGN KEY ("asociatie_id") REFERENCES "asociatii"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anunturi" ADD CONSTRAINT "anunturi_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "utilizatori"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesizari" ADD CONSTRAINT "sesizari_apartament_id_fkey" FOREIGN KEY ("apartament_id") REFERENCES "apartamente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesizari" ADD CONSTRAINT "sesizari_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "utilizatori"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificari" ADD CONSTRAINT "notificari_utilizator_id_fkey" FOREIGN KEY ("utilizator_id") REFERENCES "utilizatori"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "utilizatori" ADD CONSTRAINT "utilizatori_asociatie_id_fkey" FOREIGN KEY ("asociatie_id") REFERENCES "asociatii"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocuri" ADD CONSTRAINT "blocuri_asociatie_id_fkey" FOREIGN KEY ("asociatie_id") REFERENCES "asociatii"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scari" ADD CONSTRAINT "scari_bloc_id_fkey" FOREIGN KEY ("bloc_id") REFERENCES "blocuri"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apartamente" ADD CONSTRAINT "apartamente_scara_id_fkey" FOREIGN KEY ("scara_id") REFERENCES "scari"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proprietati" ADD CONSTRAINT "proprietati_apartament_id_fkey" FOREIGN KEY ("apartament_id") REFERENCES "apartamente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proprietati" ADD CONSTRAINT "proprietati_utilizator_id_fkey" FOREIGN KEY ("utilizator_id") REFERENCES "utilizatori"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plati" ADD CONSTRAINT "plati_apartament_id_fkey" FOREIGN KEY ("apartament_id") REFERENCES "apartamente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plati" ADD CONSTRAINT "plati_platitor_id_fkey" FOREIGN KEY ("platitor_id") REFERENCES "utilizatori"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plati" ADD CONSTRAINT "plati_inregistrat_de_id_fkey" FOREIGN KEY ("inregistrat_de_id") REFERENCES "utilizatori"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alocari_plati" ADD CONSTRAINT "alocari_plati_plata_id_fkey" FOREIGN KEY ("plata_id") REFERENCES "plati"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alocari_plati" ADD CONSTRAINT "alocari_plati_fisa_id_fkey" FOREIGN KEY ("fisa_id") REFERENCES "fise_intretinere"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penalizari" ADD CONSTRAINT "penalizari_fisa_id_fkey" FOREIGN KEY ("fisa_id") REFERENCES "fise_intretinere"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abonamente" ADD CONSTRAINT "abonamente_asociatie_id_fkey" FOREIGN KEY ("asociatie_id") REFERENCES "asociatii"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abonamente" ADD CONSTRAINT "abonamente_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "planuri"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abonamente" ADD CONSTRAINT "abonamente_plan_urmator_id_fkey" FOREIGN KEY ("plan_urmator_id") REFERENCES "planuri"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portofele_tokeni" ADD CONSTRAINT "portofele_tokeni_asociatie_id_fkey" FOREIGN KEY ("asociatie_id") REFERENCES "asociatii"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tranzactii_tokeni" ADD CONSTRAINT "tranzactii_tokeni_portofel_id_fkey" FOREIGN KEY ("portofel_id") REFERENCES "portofele_tokeni"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tranzactii_tokeni" ADD CONSTRAINT "tranzactii_tokeni_actiune_id_fkey" FOREIGN KEY ("actiune_id") REFERENCES "actiuni_taxabile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tranzactii_tokeni" ADD CONSTRAINT "tranzactii_tokeni_comanda_id_fkey" FOREIGN KEY ("comanda_id") REFERENCES "comenzi_simulate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tranzactii_tokeni" ADD CONSTRAINT "tranzactii_tokeni_utilizator_id_fkey" FOREIGN KEY ("utilizator_id") REFERENCES "utilizatori"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comenzi_simulate" ADD CONSTRAINT "comenzi_simulate_asociatie_id_fkey" FOREIGN KEY ("asociatie_id") REFERENCES "asociatii"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comenzi_simulate" ADD CONSTRAINT "comenzi_simulate_utilizator_id_fkey" FOREIGN KEY ("utilizator_id") REFERENCES "utilizatori"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comenzi_simulate" ADD CONSTRAINT "comenzi_simulate_abonament_id_fkey" FOREIGN KEY ("abonament_id") REFERENCES "abonamente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comenzi_simulate" ADD CONSTRAINT "comenzi_simulate_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "planuri"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comenzi_simulate" ADD CONSTRAINT "comenzi_simulate_pachet_id_fkey" FOREIGN KEY ("pachet_id") REFERENCES "pachete_tokeni"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cupoane_reducere" ADD CONSTRAINT "cupoane_reducere_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "planuri"("id") ON DELETE SET NULL ON UPDATE CASCADE;
