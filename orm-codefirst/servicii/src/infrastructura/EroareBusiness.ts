/** Codurile erorilor de business; fiecare are un status HTTP potrivit, folosit de API si de MVC. */
const STATUS = {
  NEGASIT: 404,
  DATE_INVALIDE: 400,
  CONFLICT: 409,
  ABONAMENT_INACTIV: 403,
  SOLD_INSUFICIENT: 402,
  PLAN_NEPERMIS: 403,
} as const;

export type CodEroare = keyof typeof STATUS;

/**
 * Eroare de business: o regula a aplicatiei a refuzat operatia (nu o eroare tehnica).
 * "camp" leaga eroarea de un camp din formular sau din body, cand e cazul.
 */
export class EroareBusiness extends Error {
  readonly status: number;

  constructor(
    readonly cod: CodEroare,
    mesaj: string,
    readonly camp?: string,
    readonly detalii?: Record<string, unknown>,
  ) {
    super(mesaj);
    this.status = STATUS[cod];
  }
}
