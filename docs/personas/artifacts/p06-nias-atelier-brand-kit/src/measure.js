/**
 * Le contraste, MESURÉ dans la page, jamais affirmé.
 *
 * Un nuancier qui imprime un nombre écrit à la main est un nuancier qui ment
 * dès que quelqu'un change une valeur. Celui-ci lit le style calculé et fait
 * le calcul WCAG, dans le thème où il se trouve.
 *
 * Trois pièges, tous rencontrés pendant la construction de ce kit:
 *   · `getImageData` rend du RGBA DROIT (non prémultiplié). Diviser par alpha
 *     donne des canaux au-dessus de 255 et un ratio inventé.
 *   · un canvas non effacé fait lire `rgba(0,0,0,0)` comme une couleur opaque.
 *   · un ancêtre à `opacity: 0` fait tomber le contraste à exactement 1.00.
 */
const cv = typeof document !== "undefined" ? document.createElement("canvas") : null;
if (cv) cv.width = cv.height = 1;
const cx = cv ? cv.getContext("2d", { willReadFrequently: true }) : null;

/** `null` si la valeur ne se lit pas — jamais une couleur de repli. */
export function parseColor(value) {
  if (!cx || !value) return null;
  for (const sentinel of ["#000000", "#ffffff"]) {
    cx.clearRect(0, 0, 1, 1);
    cx.fillStyle = sentinel;
    cx.fillStyle = value;
    if (cx.fillStyle === sentinel && value !== sentinel) continue;
    cx.clearRect(0, 0, 1, 1);
    cx.fillRect(0, 0, 1, 1);
    const d = cx.getImageData(0, 0, 1, 1).data;
    if (d[0] > 255 || d[1] > 255 || d[2] > 255) return null;
    return [d[0], d[1], d[2], d[3] / 255];
  }
  return null;
}

const over = (f, b) => (f[3] >= 1 ? f.slice(0, 3) : [0, 1, 2].map((i) => f[i] * f[3] + b[i] * (1 - f[3])));

function luminance(c) {
  const s = c.map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * s[0] + 0.7152 * s[1] + 0.0722 * s[2];
}

export function ratio(a, b) {
  if (!a || !b) return null;
  const [hi, lo] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (hi + 0.05) / (lo + 0.05);
}

/** Le fond réellement peint derrière un élément, en compositant les couches. */
export function backdrop(el) {
  let acc = null;
  let n = el;
  while (n && n.nodeType === 1) {
    const bg = parseColor(getComputedStyle(n).backgroundColor);
    if (bg && bg[3] > 0) {
      acc = acc === null ? bg : [...over(acc, bg), bg[3] >= 1 ? 1 : bg[3]];
      if (bg[3] >= 1) return acc.slice(0, 3);
    }
    n = n.parentElement;
  }
  const root = parseColor(getComputedStyle(document.documentElement).backgroundColor) || [255, 255, 255, 1];
  return acc === null ? root.slice(0, 3) : over(acc, root.slice(0, 3));
}

/** Le contraste texte-sur-fond d'un élément rendu, ou `null` si illisible. */
export function contrastOf(el) {
  const fg = parseColor(getComputedStyle(el).color);
  if (!fg) return null;
  const bg = backdrop(el);
  return ratio(over(fg, bg), bg);
}

/** Le contraste entre deux valeurs CSS quelconques, sur un fond donné. */
export function contrastBetween(inkValue, surfaceValue) {
  const ink = parseColor(inkValue);
  const surface = parseColor(surfaceValue);
  if (!ink || !surface) return null;
  return ratio(over(ink, surface.slice(0, 3)), surface.slice(0, 3));
}

/** AA pour du texte normal = 4.5, AA pour du grand texte = 3. */
export const grade = (r) => (r === null ? "—" : r >= 7 ? "AAA" : r >= 4.5 ? "AA" : r >= 3 ? "AA large" : "échec");
