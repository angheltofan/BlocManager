import type { BlockManagerContext } from "repository-codefirst";
import type { Logger } from "../infrastructura/Logger.ts";
import type { Evenimente, MagistralaEvenimente } from "../infrastructura/MagistralaEvenimente.ts";
import { urmatorulNumar } from "../servicii/utilitare.ts";

const COTA_TVA = 0.21;

/**
 * Consumatorul 1 al evenimentului PlataEfectuata: emite factura simulata a comenzii platite
 * (numar BM-AAAA-NNNNNN, subtotal + TVA 21% = suma comenzii). Este idempotent: o comanda are o singura factura.
 */
export class ConsumatorFacturi {
  private readonly db: BlockManagerContext;
  private readonly log: Logger;

  constructor(dep: { db: BlockManagerContext; logger: Logger }) {
    this.db = dep.db;
    this.log = dep.logger.pentru("ConsumatorFacturi");
  }

  inregistreaza(magistrala: MagistralaEvenimente) {
    magistrala.abonare("PlataEfectuata", "ConsumatorFacturi", (e) => this.emiteFactura(e));
  }

  async emiteFactura(e: Evenimente["PlataEfectuata"]) {
    const totalBani = Math.round(Number(e.suma) * 100);
    const subtotalBani = Math.round(totalBani / (1 + COTA_TVA));
    const factura = await this.db.$transaction(async (tx) => {
      const existenta = await tx.facturaSimulata.findUnique({ where: { comandaId: e.comandaId } });
      if (existenta) return existenta;
      return tx.facturaSimulata.create({
        data: {
          comandaId: e.comandaId,
          numar: await urmatorulNumar(tx, "BM"),
          dataEmitere: new Date(e.achitataLa.slice(0, 10) + "T00:00:00Z"),
          subtotal: (subtotalBani / 100).toFixed(2),
          tva: ((totalBani - subtotalBani) / 100).toFixed(2),
          total: (totalBani / 100).toFixed(2),
        },
      });
    });
    this.log.info(`Factură emisă: ${factura.numar}`, { comanda: e.referinta, total: factura.total.toString() });
  }
}
