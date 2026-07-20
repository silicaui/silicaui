/**
 * The behavior marker vocabulary (architecture §7). Duplicated here — not
 * imported from `@wizeworks/silicaui-html` — on purpose: the contract is the STRING
 * values in `data-sui-*` attributes, not shared TS identity, so this runtime
 * stays buildable with zero dependencies (any host lowering the same names
 * drives it identically).
 */
export type BehaviorType =
  | "carousel"
  | "disclosure"
  | "tabs"
  | "menu"
  | "marquee"
  | "scrollspy"
  | "counter"
  | "dismiss"
  | "toc"
  | "form"
  | "sidebar"
  | "selection-list"
  | "modal"
  | "popover"
  | "combobox"
  | "date-segment"
  | "pin-input"
  | "calendar"
  | "tree"
  | "wizard"
  | "number-field"
  | "toggle-group"
  | "scroll-area"
  | "overflow-list"
  | "dropzone"
  | "slider"
  | "switch"
  | "rating"
  | "theme-toggle"
  | "phone-input"
  | "reveal"
  | "countdown"
  | "tag-input"
  | "color-picker";

/** A gathered form value: one control's value, or many for a repeated name. */
export type FormValue = string | string[];

/** The payload the `form` behavior dispatches to a host `onAction` on submit. */
export interface FormSubmitPayload {
  kind: "submit";
  /** Field values keyed by control `name` (native FormData semantics). */
  values: Record<string, FormValue>;
  /** The submitting `<form>` element (for host-side DOM access if needed). */
  form: HTMLFormElement;
}

/**
 * A host action dispatch. Today the `form` behavior is the only caller (a
 * validated submit), but the channel is generic so future action markers
 * (`data-sui-action` links/buttons) resolve through the same seam.
 */
export type ActionPayload = FormSubmitPayload;

export interface HydrateOptions {
  /**
   * Editor-canvas preview mode (§9.8): autoplay (carousel/marquee/counter)
   * is suppressed, `reveal` shows its final state immediately (no
   * scroll-jank while editing), and collapsed panels (disclosure/tabs/menu)
   * are revealed.
   * A `form` in preview validates but never dispatches (no host side effects).
   */
  preview?: boolean;
  /**
   * Resolve a `data-sui-bind` ref to a value — used by `form` to PREFILL a bound
   * control from host data at hydrate time. Opaque ref; the runtime never parses it.
   */
  resolve?: (ref: string) => unknown;
  /**
   * Dispatch a host action (§8). `form` calls this with a `FormSubmitPayload`
   * once a submit passes validation. May return a Promise; while it is pending
   * the form is marked busy and its submit control disabled, then the form's
   * `data-sui-state` settles to `success` or `error`. When ABSENT, a valid form
   * falls through to native submission (progressive enhancement).
   */
  onAction?: (ref: string | null, payload: ActionPayload) => void | Promise<void>;
}

/** A behavior handler wires one root element and returns its teardown. */
export type BehaviorHandler = (root: Element, opts: HydrateOptions) => () => void;
