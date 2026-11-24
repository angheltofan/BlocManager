import type { Notificare } from "librarie-modele";
import { getContext, type BlockManagerContext } from "repository-codefirst";

export type NotificareCuDestinatar = Notificare & {
  utilizator: { email: string; nume: string; prenume: string; asociatie: { denumire: string } | null };
};

const destinatar = { select: { email: true, nume: true, prenume: true, asociatie: { select: { denumire: true } } } } as const;

/**
 * Accessor pentru tabelul "notificari" (modelul Notificare).
 *
 * O notificare poate fi stearsa fizic: id-ul ei nu este cheie straina in niciun alt tabel, iar istoricul
 * aplicatiei (plati, facturi, jurnalul de tokeni, auditul) nu depinde de ea.
 */
export class NotificariAccessor {
  constructor(private readonly db: BlockManagerContext = getContext()) {}

  /** GetAll: notificarile, cele mai noi primele, cu destinatarul si asociatia lui. */
  getToate(): Promise<NotificareCuDestinatar[]> {
    return this.db.notificare.findMany({ orderBy: { id: "desc" }, include: { utilizator: destinatar } });
  }

  /** Get: o notificare dupa id, sau null. */
  getDupaId(id: number): Promise<NotificareCuDestinatar | null> {
    return this.db.notificare.findUnique({ where: { id }, include: { utilizator: destinatar } });
  }

  marcheazaCitita(id: number): Promise<Notificare> {
    return this.db.notificare.update({ where: { id }, data: { citita: true } });
  }

  /** Stergere fizica: randul este eliminat din baza de date (DELETE FROM notificari WHERE id = ...). */
  sterge(id: number): Promise<Notificare> {
    return this.db.notificare.delete({ where: { id } });
  }

  /** Stergere fizica a tuturor notificarilor citite. Intoarce numarul de randuri sterse. */
  async stergeCitite(): Promise<number> {
    return (await this.db.notificare.deleteMany({ where: { citita: true } })).count;
  }
}
