import type { Request, Response } from "express";
import type { Container, Dependente } from "servicii";

/**
 * DiController (Laboratorul 10, exercitiul 3): arata efectul duratei de viata a obiectelor injectate.
 *
 *   GET /di   rezolva ServiciuCupoane de mai multe ori si afiseaza numarul fiecarei instante:
 *             de doua ori in scope-ul cererii curente, o data intr-un alt scope (ca o alta cerere HTTP)
 *             si instanta pe care ServiciuComenzi o primeste prin constructor.
 *
 * Singleton: acelasi numar peste tot si la fiecare refresh. Scoped: acelasi numar in cererea curenta, altul
 * in alt scope si la fiecare refresh. Transient: un numar nou la fiecare rezolvare.
 */
export class DiController {
  private readonly cradle: Dependente;

  constructor(dep: Dependente) {
    this.cradle = dep; // doar pagina de demonstratie primeste containerul; controllerele obisnuite primesc servicii
  }

  index = (_req: Request, res: Response) => {
    const { monitorInstante: m, durataViata } = this.cradle;
    const scope = res.locals.scope as Container;
    const prima = scope.cradle.serviciuCupoane;
    const aDoua = scope.cradle.serviciuCupoane;
    const altScope = scope.createScope().cradle.serviciuCupoane;
    const dinComenzi = (scope.cradle.serviciuComenzi as unknown as { cupoane: object }).cupoane;
    const rezolvari = [
      { unde: "Cererea curentă, prima rezolvare", numar: m.numar(prima) },
      { unde: "Cererea curentă, a doua rezolvare", numar: m.numar(aDoua) },
      { unde: "Injectat în ServiciuComenzi (cererea curentă)", numar: m.numar(dinComenzi) },
      { unde: "Alt scope (ca o altă cerere HTTP)", numar: m.numar(altScope) },
    ];
    res.render("di/index", { titlu: "Durata de viață (DI)", durataViata, rezolvari, totaluri: m.totaluriPeClase(), aceeasiInCerere: prima === aDoua });
  };
}
