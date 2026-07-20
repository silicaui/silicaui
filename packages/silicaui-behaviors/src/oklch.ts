/**
 * OKLCH ↔ sRGB color math — pure, dependency-free.
 *
 * DUPLICATED, ON PURPOSE, from `silicaui-react/src/lib/oklch.ts`. This package
 * is a zero-dependency runtime: importing the React package to share the math
 * would drag a React dependency into every vanilla page that hydrates a color
 * picker. The same reasoning already keeps `BehaviorType` duplicated across the
 * two packages.
 *
 * Unlike a duplicated string union, duplicated MATH can drift silently — the
 * two copies would still typecheck, still run, and just disagree by a few
 * hundredths in the third decimal. So `verify-oklch-parity.mjs` runs both
 * implementations over a sweep of colors and fails if any result differs.
 *
 * SilicaUI's whole color system is OKLCH (see the theme tokens), so the
 * `ColorPicker` is OKLCH-native: it edits L (lightness 0–1), C (chroma 0–~0.37),
 * and H (hue 0–360) directly. These helpers convert to/from sRGB so the picker
 * can show a hex readout and accept hex input, and clamp out-of-gamut colors for
 * display. The matrices are Björn Ottosson's canonical OKLab ⇄ linear-sRGB
 * transforms (https://bottosson.github.io/posts/oklab/).
 */

export interface Oklch {
  /** Lightness, 0–1. */
  l: number;
  /** Chroma, 0–~0.37 (values past the sRGB gamut get clamped on export). */
  c: number;
  /** Hue angle in degrees, 0–360. */
  h: number;
}

/** Largest chroma the picker exposes — a bit past sRGB's gamut for most hues. */
export const MAX_CHROMA = 0.37;

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

/** linear-light channel → gamma-encoded sRGB (0–1). */
function gammaEncode(x: number): number {
  return x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
}

/** gamma-encoded sRGB channel (0–1) → linear-light. */
function gammaDecode(x: number): number {
  return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
}

/** OKLCH → linear sRGB (may fall outside 0–1 when out of gamut). */
function oklchToLinear(l: number, c: number, h: number): [number, number, number] {
  const hr = (h * Math.PI) / 180;
  const a = c * Math.cos(hr);
  const b = c * Math.sin(hr);

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;

  const L = l_ * l_ * l_;
  const M = m_ * m_ * m_;
  const S = s_ * s_ * s_;

  return [
    4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S,
    -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S,
    -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S,
  ];
}

/** True if the OKLCH color is representable in sRGB without clamping. */
export function inGamut(l: number, c: number, h: number): boolean {
  const [r, g, b] = oklchToLinear(l, c, h);
  const eps = 1e-4;
  return (
    r >= -eps &&
    r <= 1 + eps &&
    g >= -eps &&
    g <= 1 + eps &&
    b >= -eps &&
    b <= 1 + eps
  );
}

/** OKLCH → sRGB bytes (0–255), gamut-clamped per channel. */
export function oklchToRgb(l: number, c: number, h: number): [number, number, number] {
  const [r, g, b] = oklchToLinear(l, c, h);
  return [
    Math.round(clamp01(gammaEncode(r)) * 255),
    Math.round(clamp01(gammaEncode(g)) * 255),
    Math.round(clamp01(gammaEncode(b)) * 255),
  ];
}

/** OKLCH → `#rrggbb`, gamut-clamped. */
export function oklchToHex(l: number, c: number, h: number): string {
  const [r, g, b] = oklchToRgb(l, c, h);
  const hex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

/** `#rgb`/`#rrggbb` → OKLCH, or `null` if it doesn't parse. */
export function hexToOklch(hex: string): Oklch | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m || !m[1]) return null;
  let s = m[1];
  if (s.length === 3) s = s.replace(/./g, (ch) => ch + ch);
  const rn = parseInt(s.slice(0, 2), 16) / 255;
  const gn = parseInt(s.slice(2, 4), 16) / 255;
  const bn = parseInt(s.slice(4, 6), 16) / 255;

  const r = gammaDecode(rn);
  const g = gammaDecode(gn);
  const b = gammaDecode(bn);

  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m2 = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s2 = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m2);
  const s_ = Math.cbrt(s2);

  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const bb = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;

  const c = Math.sqrt(a * a + bb * bb);
  let hue = (Math.atan2(bb, a) * 180) / Math.PI;
  if (hue < 0) hue += 360;
  return { l: L, c, h: hue };
}

/** OKLCH → a canonical `oklch(L C H)` string with sensible rounding. */
export function formatOklch(l: number, c: number, h: number): string {
  const r3 = (n: number) => Math.round(n * 1000) / 1000;
  const r1 = (n: number) => Math.round(n * 10) / 10;
  return `oklch(${r3(l)} ${r3(c)} ${r1(h)})`;
}

/** Parse an `oklch(L C H)` string (L/C plain numbers or %) → OKLCH, or `null`. */
export function parseOklch(input: string): Oklch | null {
  const m = /oklch\(\s*([\d.]+%?)\s+([\d.]+%?)\s+([\d.]+)/i.exec(input);
  if (!m) return null;
  const [, ls, cs, hs] = m;
  if (ls === undefined || cs === undefined || hs === undefined) return null;
  const num = (s: string, scale: number) =>
    s.endsWith("%") ? (parseFloat(s) / 100) * scale : parseFloat(s);
  return { l: num(ls, 1), c: num(cs, 1), h: parseFloat(hs) };
}
