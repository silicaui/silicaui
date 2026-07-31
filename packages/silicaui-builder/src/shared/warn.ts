/**
 * One place to say "we dropped something you gave us, and here is why".
 *
 * Host contributions (theme shelves, inspector tabs, palette groups) are merged
 * against rules the host cannot see, so anything we discard has to announce
 * itself — a contribution that silently never appears is the exact class of
 * degradation that reads as a mystery weeks later. `Once` because these run in
 * render paths that repeat every keystroke; a per-render warning is noise nobody
 * reads, which is the same as no warning at all.
 *
 * Deliberately NOT dev-gated: a host wiring its integration against a production
 * build needs the same diagnostic, and one line per distinct problem costs
 * nothing.
 */
const warned = new Set<string>();

export function warnOnce(key: string, message: string): void {
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(`[silicaui-builder] ${message}`);
}
