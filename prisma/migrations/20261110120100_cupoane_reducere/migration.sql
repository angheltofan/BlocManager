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
CREATE UNIQUE INDEX "cupoane_reducere_cod_key" ON "cupoane_reducere"("cod");

-- AddForeignKey
ALTER TABLE "cupoane_reducere" ADD CONSTRAINT "cupoane_reducere_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "planuri"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Date de test
INSERT INTO "cupoane_reducere" ("cod", "procent_reducere", "plan_id", "valabil_pana", "utilizari_maxime", "utilizari", "activ") VALUES
    ('BUNVENIT20', 20, (SELECT "id" FROM "planuri" WHERE "cod" = 'PRO'), '2026-12-31', 100, 0, true),
    ('MAX15',      15, (SELECT "id" FROM "planuri" WHERE "cod" = 'MAX'), '2026-11-30',  20, 3, true),
    ('TOAMNA10',   10, NULL,                                            '2026-11-15',  50, 12, true),
    ('VARA5',       5, NULL,                                            '2026-08-31',  10, 10, false);
