/**
 * Nia's Atelier — le kit de marque, en une page.
 *
 * L'allure: une planche de spécimen d'atelier. Beaucoup de blanc, de grands
 * caractères, la couleur qui fait tout le travail. Rien qui ressemble à une
 * application.
 */
import { useEffect, useState } from "react";
import {
  Badge,
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@wizeworks/silicaui-react";
import ComponentSheet from "./ComponentSheet.jsx";
import { PALETTES, ROLES, SCALE, SPECIMEN } from "./data.js";
import { contrastBetween, contrastOf, grade } from "./measure.js";

const SECTIONS = [
  { id: "palette", label: "Palette" },
  { id: "typography", label: "Typography" },
  { id: "components", label: "Components in atelier-clay" },
  { id: "nested", label: "Components in atelier-ink, nested inside atelier-clay" },
  { id: "notes", label: "Nia's notes on where this palette should not be used" },
];

/** Un échantillon, avec son contraste LU dans la page, jamais écrit à la main. */
function Swatch({ role }) {
  const [el, setEl] = useState(null);
  const [read, setRead] = useState(null);

  useEffect(() => {
    if (!el) return;
    // Deux images suffisent: l'encre sur la couleur, et la couleur sur la
    // surface du thème qui la contient. La seconde est celle qu'on oublie.
    const cs = getComputedStyle(el);
    const island = el.closest("[data-theme]") || document.documentElement;
    setRead({
      value: getComputedStyle(island).getPropertyValue(`--color-${role.name}`).trim(),
      onFill: contrastOf(el),
      fillOnSurface: contrastBetween(cs.backgroundColor, getComputedStyle(island).backgroundColor),
    });
  }, [el, role.name]);

  const n = (v) => (v == null ? "…" : v.toFixed(2));

  return (
    <figure className="flex flex-col gap-3">
      <div
        ref={setEl}
        className={`bg-${role.name} text-${role.name}-content h-28 rounded-box flex items-end p-3`}
        data-swatch={role.name}
      >
        <span className="text-sm font-medium">{role.name}</span>
      </div>
      <figcaption className="flex flex-col gap-1 text-sm text-base-content">
        <span className="font-medium">{role.note}</span>
        <code className="text-xs" data-value={role.name}>
          {read?.value || "…"}
        </code>
        <span data-read="ink">
          encre sur la couleur&nbsp;: <strong>{n(read?.onFill)}</strong> ({grade(read?.onFill ?? null)})
        </span>
        <span data-read="fill">
          couleur sur la surface&nbsp;: <strong>{n(read?.fillOnSurface)}</strong> ({grade(read?.fillOnSurface ?? null)})
        </span>
      </figcaption>
    </figure>
  );
}

function PaletteBoard({ theme, label, note }) {
  return (
    <section
      data-theme={theme}
      data-board={theme}
      className="bg-base-100 text-base-content rounded-box p-6 sm:p-8 flex flex-col gap-6"
    >
      <header className="flex flex-col gap-1">
        <h3 className="text-2xl">{label}</h3>
        <p className="text-md">{note}</p>
      </header>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {ROLES.map((r) => (
          <Swatch key={r.name} role={r} />
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        {ROLES.map((r) => (
          <Button key={r.name} color={r.name}>
            {r.name}
          </Button>
        ))}
      </div>
    </section>
  );
}

function TypeSpecimen() {
  return (
    <div className="flex flex-col gap-8">
      {SCALE.map((step) => (
        <div key={step} className="flex flex-col gap-2" data-step={step}>
          <span className="text-sm text-base-content">{step}</span>
          <p className={`${step} text-base-content`}>{SPECIMEN}</p>
        </div>
      ))}
      <div className="bg-base-200 rounded-box p-6 flex flex-col gap-2" data-step="text-xs-on-soft">
        <span className="text-sm text-base-content">text-xs sur une surface plus sombre</span>
        <p className="text-xs text-base-content">{SPECIMEN}</p>
      </div>
    </div>
  );
}

function IslandCard({ theme, title, id }) {
  return (
    <div
      data-theme={theme}
      id={id}
      className="bg-base-100 text-base-content rounded-box p-6 flex flex-col items-start gap-4"
    >
      <h3 className="text-xl">{title}</h3>
      <Button color="terracotta">Commander</Button>
      <Badge color="terracotta">Édition 2026</Badge>
      <Dialog>
        <DialogTrigger
          render={
            <Button color="terracotta" variant="outline">
              Ouvrir un dialogue
            </Button>
          }
        />
        <DialogContent>
          <DialogTitle>{title}</DialogTitle>
          <p className="text-md">
            Ce dialogue est ouvert depuis {theme}. Il est porté sur
            <code> document.body</code>, donc il sort de l&rsquo;îlot.
          </p>
          <Button color="terracotta">Bouton dans le dialogue</Button>
          <DialogClose render={<Button color="terracotta" variant="outline">Fermer</Button>} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function App() {
  const [theme, setTheme] = useState("atelier-clay");
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Un lien profond à froid — /#nested collé dans la barre d'adresse — ne
  // remonte à rien: au moment où le navigateur traite le fragment, React n'a
  // encore rien rendu, donc la cible n'existe pas. Mesuré: scrollY restait à 0.
  // Ce n'est pas silicaui, c'est ce que fait toute application rendue au
  // client, et c'est à l'application de le rattraper après le montage.
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!id) return;
    const target = document.getElementById(id);
    if (target) target.scrollIntoView();
  }, []);

  return (
    <div className="bg-base-100 text-base-content min-h-screen">
      <header className="mx-auto max-w-6xl px-5 sm:px-8 pt-12 pb-10 flex flex-col gap-7">
        <h1 className="display-3">Nia&rsquo;s Atelier</h1>
        <p className="text-lg max-w-2xl">
          Un kit de marque vivant. Quatre rôles qui n&rsquo;existaient pas avant que je les
          tape, et trois palettes qui ne sont aucune des vingt livrées.
        </p>
        <nav aria-label="Sections" className="flex flex-wrap gap-x-6 gap-y-2">
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="link text-md">
              {s.label}
            </a>
          ))}
        </nav>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-md">Palette&nbsp;:</span>
          {PALETTES.map((p) => (
            <Button
              key={p.theme}
              color="terracotta"
              variant={theme === p.theme ? "solid" : "outline"}
              aria-pressed={theme === p.theme}
              onClick={() => setTheme(p.theme)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 sm:px-8 pb-24 flex flex-col gap-24">
        <section id="palette" className="flex flex-col gap-10 scroll-mt-8">
          <h2 className="text-4xl">Palette</h2>
          <p className="text-md max-w-2xl">
            Les nombres à côté de chaque échantillon sont lus dans la page au moment où
            elle s&rsquo;affiche. Aucun n&rsquo;est écrit à la main.
          </p>
          {PALETTES.map((p) => (
            <PaletteBoard key={p.theme} {...p} />
          ))}
        </section>

        <section id="typography" className="flex flex-col gap-10 scroll-mt-8">
          <h2 className="text-4xl">Typography</h2>
          <TypeSpecimen />
        </section>

        <section id="components" className="flex flex-col gap-10 scroll-mt-8">
          <h2 className="text-4xl">Components in atelier-clay</h2>
          <p className="text-md max-w-2xl">
            En haut la couleur inventée, en bas la couleur livrée. Les deux planches
            sortent de la <em>même</em> fonction, avec un seul argument de différence.
          </p>
          <div className="flex flex-col gap-14">
            <div className="flex flex-col gap-6" data-planche="terracotta">
              <h3 className="text-2xl">terracotta — inventée</h3>
              <ComponentSheet color="terracotta" idPrefix="clay-t" />
            </div>
            <div className="flex flex-col gap-6" data-planche="primary">
              <h3 className="text-2xl">primary — livrée</h3>
              <ComponentSheet color="primary" idPrefix="clay-p" />
            </div>
          </div>
        </section>

        <section id="nested" className="flex flex-col gap-10 scroll-mt-8">
          <h2 className="text-4xl">Components in atelier-ink, nested inside atelier-clay</h2>
          <p className="text-md max-w-2xl">
            Les deux cartes portent exactement les mêmes classes. Seul
            l&rsquo;attribut <code>data-theme</code> du parent change.
          </p>
          <div data-theme="atelier-clay" className="rounded-box">
            <div className="grid gap-6 lg:grid-cols-2">
              <IslandCard theme="atelier-clay" title="atelier-clay — la page" id="island-clay" />
              <IslandCard theme="atelier-ink" title="atelier-ink — l&rsquo;îlot" id="island-ink" />
            </div>
          </div>
        </section>

        <section id="notes" className="flex flex-col gap-6 scroll-mt-8">
          <h2 className="text-4xl">Nia&rsquo;s notes on where this palette should not be used</h2>
          <div className="max-w-2xl flex flex-col gap-4 text-md">
            <p>
              <strong>atelier-signal n&rsquo;est pas une palette de production.</strong> Sa
              couleur de marque est à 0.58 de clarté et sa surface à 0.60. Elle existe
              pour montrer ce que le système fait quand on lui demande l&rsquo;impossible,
              pas pour habiller un site.
            </p>
            <p>
              <strong>terracotta ne doit pas porter du texte long.</strong> Elle tient un
              bouton et une étiquette; un paragraphe entier posé dessus fatigue avant la
              fin.
            </p>
            <p>
              <strong>verdigris est un second, et il est rare.</strong> Deux verdigris sur
              un écran et la maison n&rsquo;a plus de couleur principale.
            </p>
            <p>
              <strong>bone ne porte jamais de texte dans atelier-clay.</strong> C&rsquo;est
              une surface, pas une encre: <code>text-bone</code> sur le fond clair mesure
              <strong> 3,70</strong>, sous le seuil AA de 4,5. Je ne l&rsquo;ai pas trouvé à
              l&rsquo;œil — la compilation me l&rsquo;a dit, en le mesurant, avec le nombre.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
