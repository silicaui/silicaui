/**
 * Kaihō's real data.
 *
 * The first five vessels are typed exactly as the operations team writes them,
 * because they are the ones that break things: a macron, an umlaut, CJK, a
 * 43-character name, two-decimal percentages, and a NEGATIVE delay, which is a
 * ship arriving early and not an error.
 *
 * The other 795 are generated from the same shape. Generated, not invented one
 * by one — but generated from the real alphabet, so the hard characters appear
 * throughout the table and not only in the first page.
 */

export interface Vessel {
  id: string;
  name: string;
  line: string;
  /** Twenty-foot equivalent units — the ship's container capacity. */
  teu: number;
  /** Percent, two decimals, as operations reports it. */
  utilisation: number;
  lastPort: string;
  /** Hours late. NEGATIVE means early, which is a real value. */
  delayHours: number;
}

export const LINES = ["Kaihō Line", "Pacific Bridge", "Nordhaven", "Litoral"] as const;
export type Line = (typeof LINES)[number];

/** The five the operations team named. Typed as written. */
export const REAL_VESSELS: Vessel[] = [
  {
    id: "v-hakuho-maru",
    name: "MV Hakuhō Maru",
    line: "Kaihō Line",
    teu: 8540,
    utilisation: 91.4,
    lastPort: "Yokohama",
    delayHours: 0,
  },
  {
    id: "v-emerald-strait",
    name: "MV Emerald Strait",
    line: "Pacific Bridge",
    teu: 14200,
    utilisation: 78.0,
    lastPort: "Busan",
    delayHours: 14,
  },
  {
    id: "v-konigsberg-express",
    name: "MV Königsberg Express",
    line: "Nordhaven",
    teu: 21413,
    utilisation: 96.25,
    lastPort: "Rotterdam",
    delayHours: -2,
  },
  {
    id: "v-tokyo-maru",
    name: "MV 東京丸",
    line: "Kaihō Line",
    teu: 6100,
    utilisation: 45.5,
    lastPort: "Kobe",
    delayHours: 38,
  },
  {
    id: "v-santa-catarina",
    name: "MV Santa Catarina do Sul Navegação Costeira",
    line: "Litoral",
    teu: 3980,
    utilisation: 12.75,
    lastPort: "Santos",
    delayHours: 112,
  },
];

const PREFIXES = [
  "Hakuhō",
  "Königsberg",
  "東京",
  "Emerald",
  "Santa Catarina",
  "Kamakura",
  "Nordlys",
  "Açu",
  "Shirogane",
  "Björnøya",
  "神戸",
  "Salvador",
  "Tromsø",
  "Ōsaka",
  "Rio Grande",
];
const SUFFIXES = ["Maru", "Express", "Strait", "Navegação Costeira", "丸", "Voyager", "Fjord", "Passage", "Carrier"];
const PORTS = [
  "Yokohama",
  "Busan",
  "Rotterdam",
  "Kobe",
  "Santos",
  "Singapore",
  "Hamburg",
  "Tromsø",
  "Málaga",
  "神戸",
  "Antwerpen",
  "Itajaí",
];

/** A deterministic pseudo-random source, so every run of this dashboard shows
 *  the same 800 ships and a sort can be checked against a fixed expectation. */
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

export function buildFleet(total = 800): Vessel[] {
  const r = rng(20260919);
  const out: Vessel[] = [...REAL_VESSELS];
  for (let i = out.length; i < total; i++) {
    const prefix = PREFIXES[Math.floor(r() * PREFIXES.length)]!;
    const suffix = SUFFIXES[Math.floor(r() * SUFFIXES.length)]!;
    // Hours: mostly small, a long tail, and a real slice of EARLY arrivals.
    const roll = r();
    const delay = roll < 0.18 ? -Math.round(r() * 6) : roll < 0.8 ? Math.round(r() * 24) : Math.round(r() * 140);
    out.push({
      id: `v-${i}`,
      name: `MV ${prefix} ${suffix}`,
      line: LINES[Math.floor(r() * LINES.length)]!,
      teu: 2000 + Math.round(r() * 22000),
      utilisation: Math.round(r() * 10000) / 100,
      lastPort: PORTS[Math.floor(r() * PORTS.length)]!,
      delayHours: delay,
    });
  }
  return out;
}

/** Delay severity — the ONLY thing colour is allowed to mean on this dashboard. */
export function delayTone(hours: number): "success" | "warning" | "error" | "neutral" {
  if (hours <= 0) return "success";
  if (hours < 12) return "neutral";
  if (hours < 48) return "warning";
  return "error";
}

// ── the chart series ─────────────────────────────────────────────────────────

/**
 * Monthly TEU throughput, 18 months, four lines.
 *
 * Two months matter more than the other sixteen:
 *
 *  - **2026-03 is ZERO** for Nordhaven — a port strike. Nothing moved. That is a
 *    measured value and it must be drawn as a value.
 *  - **2026-07 is UNKNOWN** for Pacific Bridge — the feed was down and nobody
 *    counted. `null`, never `0`. An absence that renders identically to a
 *    measurement is the defect this whole exercise exists to catch.
 */
export interface MonthPoint {
  month: string;
  teu: Record<Line, number | null>;
}

export function buildThroughput(): MonthPoint[] {
  const r = rng(20260401);
  const out: MonthPoint[] = [];
  // 18 months ending September 2026, so the series crosses two year boundaries.
  for (let i = 17; i >= 0; i--) {
    const d = new Date(Date.UTC(2026, 8 - i, 1));
    const month = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    const teu = {} as Record<Line, number | null>;
    for (const line of LINES) teu[line] = 40000 + Math.round(r() * 60000);
    if (month === "2026-03") teu["Nordhaven"] = 0; // the strike: measured, and zero
    if (month === "2026-07") teu["Pacific Bridge"] = null; // the outage: not measured
    out.push({ month, teu });
  }
  return out;
}

// ── the handover note, and the watchlist ─────────────────────────────────────

/** Typed as the duty officer typed it, bold and all. */
export const HANDOVER_NOTE_HTML =
  "<p><strong>23:40 — Königsberg Express</strong>: pilot delayed at Rotterdam, berth 8 held. " +
  "Kobe leg unaffected. Do <strong>not</strong> re-route Hakuhō Maru; the Busan slot is confirmed " +
  "by phone (+81 45 212 7730) and is not yet in the system.</p>";

export const WATCHLIST_IDS = [
  "v-konigsberg-express",
  "v-santa-catarina",
  "v-tokyo-maru",
  "v-hakuho-maru",
  "v-emerald-strait",
  "v-5",
  "v-6",
  "v-7",
  "v-8",
];

/**
 * What the 15-minute refresh brings back.
 *
 * A fleet feed does not return the same rows in the same order forever: delays
 * move, a ship that has berthed drops off the board, and one that has just been
 * picked up appears. This returns exactly that -- the same fleet with new delay
 * figures, MINUS the vessel that has arrived, PLUS one that has not been seen
 * before. The row COUNT and the row ORDER both change, which is the point: a
 * dashboard that identifies a row by where it sits in the array has a problem
 * here and will not mention it.
 */
export function refreshFleet(current: Vessel[]): Vessel[] {
  const r = rng(Date.now() & 0xffff);
  // The vessel that has berthed leaves from wherever it happens to sit, which is
  // the middle of the list, not the top -- ships do not berth in array order.
  // This matters: dropping the FIRST row and adding one at the front leaves
  // every other row's index exactly where it was, so a dashboard that tracks a
  // row by its position would survive that by luck and fail in real life.
  const BERTHED = 1;
  const out = current
    .filter((_, i) => i !== BERTHED)
    .map((v) => ({
      ...v,
      // Delays move by a few hours either way, and stay able to go negative.
      delayHours: v.delayHours + Math.round(r() * 6) - 3,
      utilisation: Math.round((v.utilisation + (r() * 2 - 1)) * 100) / 100,
    }));
  // And the new arrival comes back at the end of the feed's own ordering.
  out.push({
    id: `v-new-${Date.now()}`,
    name: `MV Øresund Trader`,
    line: "Nordhaven",
    teu: 9120,
    utilisation: 83.5,
    lastPort: "København",
    delayHours: 3,
  });
  return out;
}
