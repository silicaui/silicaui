import { DisposeBag, ownParts, parseParams } from "../dom";
import { MAX_CHROMA, formatOklch, hexToOklch, oklchToHex, parseOklch } from "../oklch";
import type { BehaviorHandler } from "../types";

/**
 * `color-picker` — the OKLCH-native color editor, in vanilla.
 *
 * This is the real picker, not a degraded stand-in. The obvious shortcut was to
 * lower to `<input type="color">`: it works without JS and posts a value. It was
 * rejected because it is a DIFFERENT CONTROL — a native sRGB swatch dialog, not
 * an OKLCH L/C/H editor — and shipping it under the same component name would
 * misrepresent what a consumer gets. Silica's whole token system is OKLCH; a
 * picker that can't express chroma past sRGB isn't the same tool.
 *
 * Each `track` part carries `data-channel` (`l` | `c` | `h`) and behaves as a
 * real `role="slider"`: pointer drag with capture, plus arrows / PageUp+Down /
 * Home / End, matching the React component's step sizes exactly.
 *
 * The track gradients and swatch fill are painted HERE rather than emitted as
 * inline styles, because the static output must stay free of `style` attributes
 * (enforced by verify-csp). So an unhydrated page renders the picker's
 * structure unpainted — correct degradation for an editor that cannot function
 * without JS — while the hidden input still carries the value for a form post.
 */
type Channel = "l" | "c" | "h";

const RANGES: Record<Channel, { min: number; max: number; step: number }> = {
  l: { min: 0, max: 1, step: 0.01 },
  c: { min: 0, max: MAX_CHROMA, step: 0.005 },
  h: { min: 0, max: 360, step: 1 },
};

const clamp = (n: number, min: number, max: number) => (n < min ? min : n > max ? max : n);

export const colorPicker: BehaviorHandler = (root, _opts) => {
  const params = parseParams(root);
  const bag = new DisposeBag();

  const tracks = ownParts(root, "track") as HTMLElement[];
  const swatch = ownParts(root, "swatch")[0] as HTMLElement | undefined;
  const hexInput = ownParts(root, "input")[0] as HTMLInputElement | undefined;
  const readouts = ownParts(root, "value") as HTMLElement[];
  const hidden = root.querySelector('input[type="hidden"]') as HTMLInputElement | null;

  // Seed from the authored value so the picker opens where the markup says it
  // does, rather than snapping to a default the author never chose.
  const seed =
    parseOklch(String(params.value ?? "")) ??
    (hidden ? parseOklch(hidden.value) ?? hexToOklch(hidden.value) : null) ??
    parseOklch("oklch(0.7 0.15 250)")!;

  const state = { l: seed.l, c: seed.c, h: seed.h };
  const format = params.format === "hex" ? "hex" : "oklch";

  const readoutFor = (key: string) => readouts.find((el) => el.getAttribute("data-value") === key);

  const render = () => {
    const { l, c, h } = state;
    const hex = oklchToHex(l, c, h);
    const oklch = formatOklch(l, c, h);

    if (swatch) swatch.style.background = oklch;

    // Live ramps: each track shows the range it edits, holding the other two
    // channels at their current values — which is what makes the picker
    // legible while dragging.
    for (const track of tracks) {
      const ch = track.getAttribute("data-channel") as Channel | null;
      if (!ch) continue;
      const { min, max } = RANGES[ch];
      track.style.background =
        ch === "l"
          ? `linear-gradient(to right in oklch, oklch(0 ${c} ${h}), oklch(1 ${c} ${h}))`
          : ch === "c"
            ? `linear-gradient(to right in oklch, oklch(${l} 0 ${h}), oklch(${l} ${MAX_CHROMA} ${h}))`
            : `linear-gradient(to right in oklch, ${[0, 60, 120, 180, 240, 300, 360]
                .map((deg) => `oklch(${l} ${c} ${deg})`)
                .join(", ")})`;

      const value = state[ch];
      track.setAttribute("aria-valuenow", String(value));
      track.setAttribute(
        "aria-valuetext",
        ch === "l" ? value.toFixed(2) : ch === "c" ? value.toFixed(3) : `${Math.round(value)}°`,
      );
      const thumb = track.querySelector('[data-sui-part="thumb"]') as HTMLElement | null;
      if (thumb) thumb.style.left = `${((value - min) / (max - min)) * 100}%`;

      const out = readoutFor(ch);
      if (out) out.textContent = ch === "l" ? value.toFixed(2) : ch === "c" ? value.toFixed(3) : `${Math.round(value)}°`;
    }

    const oklchOut = readoutFor("oklch");
    if (oklchOut) oklchOut.textContent = oklch;
    const hexOut = readoutFor("hex");
    if (hexOut) hexOut.textContent = hex;

    // Don't fight the user's cursor while they're typing in the hex field.
    if (hexInput && document.activeElement !== hexInput) hexInput.value = hex;

    if (hidden) {
      hidden.value = format === "hex" ? hex : oklch;
      hidden.dispatchEvent(new Event("change", { bubbles: true }));
    }
    root.dispatchEvent(
      new CustomEvent("sui:change", { detail: { value: format === "hex" ? hex : oklch, oklch: { ...state }, hex }, bubbles: true }),
    );
  };

  const set = (ch: Channel, raw: number) => {
    const { min, max } = RANGES[ch];
    state[ch] = clamp(raw, min, max);
    render();
  };

  for (const track of tracks) {
    const ch = track.getAttribute("data-channel") as Channel | null;
    if (!ch) continue;
    const { min, max, step } = RANGES[ch];

    const fromClientX = (clientX: number) => {
      const rect = track.getBoundingClientRect();
      if (!rect.width) return;
      set(ch, min + clamp((clientX - rect.left) / rect.width, 0, 1) * (max - min));
    };

    bag.listen(track, "pointerdown", (ev) => {
      const e = ev as PointerEvent;
      // Capture so a drag that leaves the track keeps updating, and doesn't
      // start selecting text on the way out.
      track.setPointerCapture?.(e.pointerId);
      fromClientX(e.clientX);
    });
    bag.listen(track, "pointermove", (ev) => {
      const e = ev as PointerEvent;
      if (!track.hasPointerCapture?.(e.pointerId)) return;
      fromClientX(e.clientX);
    });
    bag.listen(track, "keydown", (ev) => {
      const e = ev as KeyboardEvent;
      const big = step * 10;
      let next: number | null = null;
      if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = state[ch] - step;
      else if (e.key === "ArrowRight" || e.key === "ArrowUp") next = state[ch] + step;
      else if (e.key === "PageDown") next = state[ch] - big;
      else if (e.key === "PageUp") next = state[ch] + big;
      else if (e.key === "Home") next = min;
      else if (e.key === "End") next = max;
      if (next === null) return;
      e.preventDefault();
      set(ch, next);
    });
  }

  if (hexInput) {
    const commitHex = () => {
      const parsed = hexToOklch(hexInput.value);
      // Invalid input reverts on the next render rather than clearing what the
      // user typed mid-edit.
      if (!parsed) return;
      state.l = parsed.l;
      state.c = parsed.c;
      state.h = parsed.h;
      render();
    };
    bag.listen(hexInput, "change", commitHex);
    bag.listen(hexInput, "keydown", (ev) => {
      if ((ev as KeyboardEvent).key === "Enter") {
        ev.preventDefault();
        commitHex();
      }
    });
    bag.listen(hexInput, "blur", () => render());
  }

  render();
  return () => bag.dispose();
};
