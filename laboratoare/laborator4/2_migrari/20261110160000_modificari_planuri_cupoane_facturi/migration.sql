-- AlterTable
ALTER TABLE "planuri" ADD COLUMN     "pret_anual" DECIMAL(10,2),
ADD COLUMN     "recomandat" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "cupoane_reducere" ALTER COLUMN "procent_reducere" SET DATA TYPE DECIMAL(5,2);

-- CreateTable
CREATE TABLE "facturi_simulate" (
    "id" SERIAL NOT NULL,
    "comanda_id" INTEGER NOT NULL,
    "numar" VARCHAR(20) NOT NULL,
    "data_emitere" DATE NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "tva" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "facturi_simulate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "facturi_simulate_comanda_id_key" ON "facturi_simulate"("comanda_id");

-- CreateIndex
CREATE UNIQUE INDEX "facturi_simulate_numar_key" ON "facturi_simulate"("numar");

-- AddForeignKey
ALTER TABLE "facturi_simulate" ADD CONSTRAINT "facturi_simulate_comanda_id_fkey" FOREIGN KEY ("comanda_id") REFERENCES "comenzi_simulate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
