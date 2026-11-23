-- AlterTable: stergerea logica a cupoanelor (cuponul sters ramane in baza de date, cu data stergerii)
ALTER TABLE "cupoane_reducere" ADD COLUMN     "sters_la" TIMESTAMP(3);
