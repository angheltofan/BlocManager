import type { Asociatie, Prisma } from "librarie-modele";
import { getContext, type BlockManagerContext } from "repository-codefirst";

export type AsociatieCuAbonament = Asociatie & {
  abonamente: { id: number; status: string; plan: { denumire: string } }[];
};

/** Datele unei asociatii noi. */
export type DateAsociatie = Pick<Prisma.AsociatieUncheckedCreateInput, "denumire" | "cui" | "adresa" | "iban" | "banca">;

/** CUI-ul exista deja (constrangerea unica asociatii.cui). */
export class CuiDuplicat extends Error {
  constructor(cui: string) {
    super(`Există deja o asociație cu CUI-ul ${cui}.`);
  }
}

/** Accessor pentru tabelul "asociatii" (modelul Asociatie). */
export class AsociatiiAccessor {
  constructor(private readonly db: BlockManagerContext = getContext()) {}

  /** GetAll: asociatiile, cu abonamentul curent (ACTIV sau SUSPENDAT), daca exista. */
  getToate(): Promise<AsociatieCuAbonament[]> {
    return this.db.asociatie.findMany({
      orderBy: { denumire: "asc" },
      include: {
        abonamente: {
          where: { status: { in: ["ACTIV", "SUSPENDAT"] } },
          select: { id: true, status: true, plan: { select: { denumire: true } } },
          take: 1,
        },
      },
    });
  }

  /** Adauga asociatia si portofelul ei de tokeni (gol), in aceeasi tranzactie. */
  async adauga(date: DateAsociatie): Promise<Asociatie> {
    try {
      return await this.db.$transaction(async (tx) => {
        const asociatie = await tx.asociatie.create({ data: date });
        await tx.portofelTokeni.create({ data: { asociatieId: asociatie.id } });
        return asociatie;
      });
    } catch (e) {
      if (typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002") throw new CuiDuplicat(date.cui);
      throw e;
    }
  }
}
