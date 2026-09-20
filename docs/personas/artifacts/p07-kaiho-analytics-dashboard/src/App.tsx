/**
 * The Kaihō operations dashboard.
 *
 * **Core only, deliberately.** Act 1 is a measurement and it cannot be taken
 * after the fact: the claim being tested is that charts, table, editor, dnd and
 * panels stay out of the bundle when you do not install them, and the only way
 * to know is to build the shell first and weigh it.
 *
 * Every slot the five packages will fill is a real placeholder with real
 * numbers behind it, so the shell is a working dashboard and not an empty
 * frame — the delta measured in act 10 is then the cost of the five engines and
 * nothing else.
 */
import * as React from "react";
import { Button, Card, CardBody, CardTitle, SearchInput } from "@wizeworks/silicaui-react";
import { buildFleet, buildThroughput, LINES, refreshFleet, WATCHLIST_IDS } from "./data";
import { ThroughputChart } from "./ThroughputChart";
import { VesselTable } from "./VesselTable";
import { HandoverNotes } from "./HandoverNotes";
import { Watchlist } from "./Watchlist";
import { FleetSplit } from "./FleetSplit";
import type { Vessel } from "./data";

const INITIAL_FLEET = buildFleet();
const THROUGHPUT = buildThroughput();

const nf = new Intl.NumberFormat("en-GB");

export function App() {
  const [theme, setTheme] = React.useState<"midnight" | "cobalt">("midnight");
  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // The fleet is STATE, not a constant. Every fifteen minutes the feed returns
  // new delays, drops the vessel that has berthed and adds one that has just
  // been picked up -- so the rows, their order and their count all move under
  // whoever is reading the screen.
  const [fleet, setFleet] = React.useState(INITIAL_FLEET);

  const stats = React.useMemo(() => {
    const late = fleet.filter((v) => v.delayHours >= 12).length;
    const critical = fleet.filter((v) => v.delayHours >= 48).length;
    const teu = fleet.reduce((n, v) => n + v.teu, 0);
    const util = fleet.reduce((n, v) => n + v.utilisation, 0) / fleet.length;
    return { late, critical, teu, util };
  }, [fleet]);

  // The line filter is the honest way to reach an EMPTY table: a real control a
  // person presses, not a prop flipped in a test.
  // The filter lives in the ADDRESS BAR, so a duty officer can send "the
  // Nordhaven ships, delayed" to the next watch instead of describing it.
  const [line, setLine] = React.useState<"All" | (typeof LINES)[number]>(() => {
    if (typeof window === "undefined") return "All";
    const v = new URLSearchParams(window.location.search).get("line");
    return (LINES as readonly string[]).includes(v ?? "") ? (v as (typeof LINES)[number]) : "All";
  });
  const [refreshing, setRefreshing] = React.useState(false);
  const [query, setQuery] = React.useState(() =>
    typeof window === "undefined" ? "" : (new URLSearchParams(window.location.search).get("q") ?? ""),
  );

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (line === "All") params.delete("line");
    else params.set("line", line);
    if (query.trim()) params.set("q", query.trim());
    else params.delete("q");
    const next = params.toString();
    // `replaceState`, not `pushState`: typing in a search box should not fill
    // the back button with one entry per keystroke.
    window.history.replaceState(null, "", next ? `?${next}` : window.location.pathname);
  }, [line, query]);
  const visible = React.useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    return fleet.filter(
      (v) =>
        (line === "All" || v.line === line) &&
        (!q || v.name.toLocaleLowerCase().includes(q) || v.lastPort.toLocaleLowerCase().includes(q)),
    );
  }, [fleet, line, query]);

  const watchlist = React.useMemo(
    () => WATCHLIST_IDS.map((id) => INITIAL_FLEET.find((v) => v.id === id)).filter((v): v is Vessel => Boolean(v)),
    [],
  );

  // The refresh itself: a spinner for a beat, then new data. Exposed so a probe
  // can fire it at a chosen moment rather than waiting fifteen minutes.
  // The time of the last refresh, stated in the operations room's OWN clock.
  //
  // This dashboard is read in Yokohama and the feed comes from Rotterdam, so a
  // bare `toLocaleTimeString()` would show the time of whatever machine the
  // browser is on -- correct for a laptop in Japan, silently eight hours out on
  // the wall screen's own box if it is set to anything else. The zone is named,
  // and so is the label beside it.
  const [refreshedAt, setRefreshedAt] = React.useState(() => formatJst(new Date()));
  const refresh = React.useCallback(() => {
    setRefreshing(true);
    window.setTimeout(() => {
      setFleet((f) => refreshFleet(f));
      setRefreshedAt(formatJst(new Date()));
      setRefreshing(false);
    }, 1200);
  }, []);
  if (typeof window !== "undefined") window.__kaihoRefresh = refresh;

  return (
    <div className="flex h-full flex-col bg-base-200 text-base-content">
      <header className="flex flex-wrap items-center gap-3 border-b border-base-300 bg-base-100 px-5 py-3">
        <span className="text-lg font-bold tracking-tight">Kaihō Analytics</span>
        <span className="text-base">Fleet operations · {nf.format(fleet.length)} vessels</span>
        <span className="flex-1" />
        <span className="text-base">Refreshed {refreshedAt}</span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setTheme((t) => (t === "midnight" ? "cobalt" : "midnight"))}
        >
          {theme === "midnight" ? "Daylight" : "Night"}
        </Button>
      </header>

      <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-4">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi label="Fleet TEU" value={nf.format(stats.teu)} />
          <Kpi label="Mean utilisation" value={`${stats.util.toFixed(2)}%`} />
          <Kpi label="Delayed 12h or more" value={nf.format(stats.late)} tone="warning" />
          <Kpi label="Delayed 48h or more" value={nf.format(stats.critical)} tone="error" />
        </section>

        <section className="grid gap-4 xl:grid-cols-[2fr_1fr]">
          <Slot
            title="Monthly TEU throughput"
            note={`${THROUGHPUT.length} months · ${LINES.length} lines`}
          >
            <ThroughputChart data={THROUGHPUT} />
          </Slot>

          <Slot title="Watchlist" note={`${watchlist.length} vessels — drag or use the keyboard to reorder`}>
            <Watchlist vessels={watchlist} />
          </Slot>
        </section>

        <FleetSplit
          table={
            <Slot title="Vessels" note={`${nf.format(visible.length)} of ${nf.format(fleet.length)} rows`}>
              <div className="flex flex-wrap items-center gap-2 pb-1">
                <SearchInput
                  size="sm"
                  placeholder="Vessel or port"
                  aria-label="Search vessels"
                  value={query}
                  onChange={(e) => setQuery(e.currentTarget.value)}
                  className="w-56"
                />
                {(["All", ...LINES] as const).map((l) => (
                  <Button
                    key={l}
                    size="sm"
                    variant={line === l ? "solid" : "outline"}
                    color={line === l ? "primary" : undefined}
                    onClick={() => setLine(l)}
                  >
                    {l}
                  </Button>
                ))}
                <Button size="sm" variant="outline" onClick={refresh} disabled={refreshing}>
                  {refreshing ? "Refreshing…" : "Refresh now"}
                </Button>
              </div>
              <VesselTable rows={visible} loading={refreshing} />
            </Slot>
          }
          notes={
            <Slot title="Handover notes" note="the watch that is going home writes this">
              <HandoverNotes />
            </Slot>
          }
        />

      </main>
    </div>
  );
}

/** `23:45 JST`, and the date too when it is not today in Tokyo. */
function formatJst(d: Date): string {
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
  const day = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Tokyo",
    day: "2-digit",
    month: "short",
  }).format(d);
  return `${day} ${time} JST`;
}

function Kpi({ label, value, tone }: { label: string; value: string; tone?: "warning" | "error" }) {
  return (
    <Card className="border border-base-300 bg-base-100">
      <CardBody className="gap-1">
        <span className="text-base text-base-content">{label}</span>
        {/* LITERAL class strings. `text-${tone}` reads fine and generates
            nothing: Tailwind emits only the classes it can SEE in the source,
            so an interpolated class name is a class with no rules behind it and
            the number silently falls back to body ink. */}
        <span
          className={
            tone === "error"
              ? "text-3xl font-bold tabular-nums text-error"
              : tone === "warning"
                ? "text-3xl font-bold tabular-nums text-warning"
                : "text-3xl font-bold tabular-nums text-base-content"
          }
        >
          {value}
        </span>
      </CardBody>
    </Card>
  );
}

function Slot({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
  return (
    <Card className="border border-base-300 bg-base-100">
      <CardBody className="gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <CardTitle className="text-lg text-base-content">{title}</CardTitle>
          <span className="text-base text-base-content">{note}</span>
        </div>
        {children}
      </CardBody>
    </Card>
  );
}

declare global {
  interface Window {
    /** Fire the fifteen-minute refresh on demand, from a probe. */
    __kaihoRefresh?: () => void;
  }
}
