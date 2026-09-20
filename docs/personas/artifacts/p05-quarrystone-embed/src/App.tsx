import * as React from "react";
import { PlantPageEditor } from "./PlantPageEditor";

const ROUTES = [
  { id: "plants", label: "Anläggningar" },
  { id: "editor", label: "Sidredigerare" },
  { id: "compliance", label: "Efterlevnad" },
  // Two plant pages open at once. Our support people do this constantly - copy
  // the opening hours from one site to another - so it is a real screen, not a
  // test fixture.
  { id: "twoup", label: "Två sidor" },
] as const;

type RouteId = (typeof ROUTES)[number]["id"];

export function App() {
  const [route, setRoute] = React.useState<RouteId>(
    () => (new URLSearchParams(location.search).get("route") as RouteId) ?? "editor",
  );
  const go = (id: RouteId) => {
    setRoute(id);
    const url = new URL(location.href);
    url.searchParams.set("route", id);
    history.replaceState(null, "", url);
  };

  return (
    <div className="flex h-full flex-col bg-base-200 text-base-content">
      <header className="flex items-center gap-4 border-b border-base-300 bg-base-100 px-5 py-3">
        <span className="text-lg font-bold tracking-tight">Quarrystone</span>
        <nav className="flex gap-1" aria-label="Huvudmeny">
          {ROUTES.map((r) => (
            <button
              key={r.id}
              type="button"
              className={`btn btn-sm ${route === r.id ? "btn-primary" : "btn-ghost"}`}
              aria-current={route === r.id ? "page" : undefined}
              onClick={() => go(r.id)}
            >
              {r.label}
            </button>
          ))}
        </nav>
        <span className="flex-1" />
        <span className="text-sm">Höganäs Kross &amp; Grus AB</span>
      </header>

      <main className="flex min-h-0 flex-1 flex-col p-4">
        {route === "editor" ? (
          <PlantPageEditor />
        ) : route === "twoup" ? (
          <div className="flex min-h-0 flex-1 gap-3">
            <div className="flex min-h-0 flex-1 flex-col">
              <PlantPageEditor instance="a" />
            </div>
            <div className="flex min-h-0 flex-1 flex-col">
              <PlantPageEditor instance="b" />
            </div>
          </div>
        ) : (
          <div className="rounded-box border border-base-300 bg-base-100 p-6">
            <h1 className="text-xl font-semibold">{ROUTES.find((r) => r.id === route)?.label}</h1>
            <p className="mt-2 text-sm">
              An ordinary Quarrystone screen. It is here so the builder is embedded on ONE route of a real app rather
              than being the whole page.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
