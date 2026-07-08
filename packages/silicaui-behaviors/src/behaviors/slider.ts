import { DisposeBag, ownParts, parseParams } from "../dom";
import type { BehaviorHandler } from "../types";

/**
 * `slider` — one or two `thumb`s on a `track`. Base UI's `.slider-track`/
 * `.slider-indicator`/`.slider-thumb` are three addressable nodes whose
 * position Base UI sets via inline styles from pointer math — a bare
 * `<input type=range>` has no such nodes, so this rebuilds that geometry
 * directly (pointer drag + full keyboard), same runtime-`.style` precedent
 * as `carousel`. Two thumbs = a range slider (`--slider-range-start/-end`
 * custom props for the fill bar CSS to read).
 */
export const slider: BehaviorHandler = (root, _opts) => {
  const params = parseParams(root);
  const min = typeof params.min === "number" ? params.min : 0;
  const max = typeof params.max === "number" ? params.max : 100;
  const step = typeof params.step === "number" && params.step > 0 ? params.step : 1;
  const track = ownParts(root, "track")[0] as HTMLElement | undefined;
  const thumbs = ownParts(root, "thumb") as HTMLElement[];
  const hiddenInputs = Array.from(root.querySelectorAll('input[type="hidden"]')) as HTMLInputElement[];
  const bag = new DisposeBag();
  if (!track || !thumbs.length) return () => bag.dispose();

  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round((v - min) / step) * step + min));
  const valueOf = (thumb: HTMLElement) => {
    const raw = Number(thumb.getAttribute("aria-valuenow"));
    return Number.isFinite(raw) ? raw : min;
  };

  const paint = () => {
    const values = thumbs.map(valueOf);
    thumbs.forEach((thumb, i) => {
      const pct = ((values[i]! - min) / (max - min || 1)) * 100;
      thumb.style.position = "absolute";
      thumb.style.left = `${pct}%`;
      thumb.setAttribute("aria-valuemin", String(min));
      thumb.setAttribute("aria-valuemax", String(max));
      thumb.setAttribute("aria-valuenow", String(values[i]));
      const input = hiddenInputs[i];
      if (input) input.value = String(values[i]);
    });
    if (thumbs.length === 2) {
      const lo = Math.min(values[0]!, values[1]!);
      const hi = Math.max(values[0]!, values[1]!);
      track.style.setProperty("--slider-range-start", `${((lo - min) / (max - min || 1)) * 100}%`);
      track.style.setProperty("--slider-range-end", `${((hi - min) / (max - min || 1)) * 100}%`);
    }
  };

  const setValue = (thumb: HTMLElement, v: number) => {
    thumb.setAttribute("aria-valuenow", String(clamp(v)));
    paint();
    thumb.dispatchEvent(new Event("change", { bubbles: true }));
  };

  thumbs.forEach((thumb) => {
    thumb.setAttribute("role", "slider");
    if (!thumb.hasAttribute("tabindex")) thumb.tabIndex = 0;

    const onMove = (ev: PointerEvent) => {
      const rect = track.getBoundingClientRect();
      const pct = rect.width ? Math.min(1, Math.max(0, (ev.clientX - rect.left) / rect.width)) : 0;
      setValue(thumb, min + pct * (max - min));
    };
    bag.listen(thumb, "pointerdown", (ev) => {
      const e = ev as PointerEvent;
      (thumb as HTMLElement & { setPointerCapture?: (id: number) => void }).setPointerCapture?.(e.pointerId);
      const move = (m: Event) => onMove(m as PointerEvent);
      const up = () => {
        document.removeEventListener("pointermove", move);
        document.removeEventListener("pointerup", up);
      };
      document.addEventListener("pointermove", move);
      document.addEventListener("pointerup", up);
    });

    bag.listen(thumb, "keydown", (ev) => {
      const e = ev as KeyboardEvent;
      const v = valueOf(thumb);
      switch (e.key) {
        case "ArrowRight":
        case "ArrowUp":
          e.preventDefault();
          setValue(thumb, v + step);
          break;
        case "ArrowLeft":
        case "ArrowDown":
          e.preventDefault();
          setValue(thumb, v - step);
          break;
        case "Home":
          e.preventDefault();
          setValue(thumb, min);
          break;
        case "End":
          e.preventDefault();
          setValue(thumb, max);
          break;
        case "PageUp":
          e.preventDefault();
          setValue(thumb, v + step * 10);
          break;
        case "PageDown":
          e.preventDefault();
          setValue(thumb, v - step * 10);
          break;
      }
    });
  });

  paint();
  return () => bag.dispose();
};
