/**
 * Acte 5 — la collision, puis le préfixe.
 *
 * La même page est rendue deux fois, depuis deux points d'entrée:
 *   collision.html — sans préfixe, avec la feuille du client par-dessus
 *   prefixed.html  — avec `prefix: na-` et `<SilicaProvider prefix="na-">`
 *
 * Trois choses sont mises côte à côte à chaque fois, et chacune porte un
 * `data-*` pour que la mesure ne devine rien:
 *   1. le bouton hérité du client — du HTML brut, `class="btn"`
 *   2. un bouton Silica rendu par le composant React
 *   3. une carte et une étiquette, pour les deux autres classes en conflit
 */
import { Badge, Button, Card, CardBody } from "@wizeworks/silicaui-react";

export default function Collision({ mode }) {
  return (
    <main className="p-8 flex flex-col gap-10 max-w-3xl">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl">Acte 5 — {mode}</h1>
        <p className="text-md">
          La feuille héritée du client est chargée <strong>après</strong> Silica.
          Les deux doivent survivre.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl">Le bouton du client</h2>
        {/* HTML brut, écrit comme sur son site: aucune classe Silica. */}
        <div>
          <button type="button" className="btn" data-probe="legacy-btn">
            Nous écrire
          </button>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl">Le bouton Silica</h2>
        <div className="flex flex-wrap gap-3">
          <Button color="terracotta" data-probe="silica-btn">
            Commander
          </Button>
          <Button color="terracotta" variant="outline" data-probe="silica-btn-outline">
            Devis
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl">Les deux autres classes en conflit</h2>
        <div className="flex flex-col gap-4">
          <div className="card" data-probe="legacy-card">
            <div className="p-4">La carte du client — une bordure grise, rien d&rsquo;autre.</div>
          </div>
          <Card data-probe="silica-card">
            <CardBody>La carte Silica — surface, rayon, profondeur.</CardBody>
          </Card>
          <div>
            <span className="badge" data-probe="legacy-badge">
              nouveau
            </span>
          </div>
          <div>
            <Badge color="terracotta" data-probe="silica-badge">
              Édition 2026
            </Badge>
          </div>
        </div>
      </section>
    </main>
  );
}
