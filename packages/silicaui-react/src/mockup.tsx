import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";

export type MockupWindowProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Silica MockupWindow — an app window frame with faux traffic-light dots.
 *
 *   <MockupWindow>
 *     <div className="p-8 text-center">Hello!</div>
 *   </MockupWindow>
 */
export const MockupWindow = React.forwardRef<HTMLDivElement, MockupWindowProps>(
  function MockupWindow({ className, ...rest }, ref) {
    const sc = useSilicaClass();
    return <div ref={ref} className={cx(sc("mockup-window"), className)} {...rest} />;
  },
);

export interface MockupBrowserProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Text shown in the faux address bar. */
  url?: string;
  /** Replace the address bar with custom toolbar content. */
  toolbar?: React.ReactNode;
}

/**
 * Silica MockupBrowser — a browser frame with a toolbar and faux address bar.
 *
 *   <MockupBrowser url="https://silica.ui">
 *     <div className="p-8 text-center">Your page</div>
 *   </MockupBrowser>
 */
export const MockupBrowser = React.forwardRef<HTMLDivElement, MockupBrowserProps>(
  function MockupBrowser({ url, toolbar, className, children, ...rest }, ref) {
    const sc = useSilicaClass();
    return (
      <div ref={ref} className={cx(sc("mockup-browser"), className)} {...rest}>
        <div className={cx(sc("mockup-browser-toolbar"))}>
          {toolbar ?? <div className={cx(sc("mockup-browser-input"))}>{url}</div>}
        </div>
        {children}
      </div>
    );
  },
);

export type MockupCodeProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Silica MockupCode — a dark terminal / code block. Compose it from
 * `<MockupCodeLine>` rows (each renders a `<pre data-prefix>`).
 *
 *   <MockupCode>
 *     <MockupCodeLine prefix="$">npm i silicaui</MockupCodeLine>
 *     <MockupCodeLine prefix=">" className="text-success">done</MockupCodeLine>
 *   </MockupCode>
 */
export const MockupCode = React.forwardRef<HTMLDivElement, MockupCodeProps>(
  function MockupCode({ className, ...rest }, ref) {
    const sc = useSilicaClass();
    return <div ref={ref} className={cx(sc("mockup-code"), className)} {...rest} />;
  },
);

export interface MockupCodeLineProps
  extends React.HTMLAttributes<HTMLPreElement> {
  /** Gutter prefix rendered before the line (e.g. `$`, `>`, a line number). */
  prefix?: string;
}

/** A single line inside `<MockupCode>`. Renders `<pre data-prefix>`. */
export const MockupCodeLine = React.forwardRef<HTMLPreElement, MockupCodeLineProps>(
  function MockupCodeLine({ prefix, className, ...rest }, ref) {
    return <pre ref={ref} data-prefix={prefix} className={className} {...rest} />;
  },
);

export type MockupPhoneProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Silica MockupPhone — a phone frame with a camera notch.
 *
 *   <MockupPhone>
 *     <div className="p-6 pt-10">Your app screen</div>
 *   </MockupPhone>
 *
 * Children render inside the display; the bezel and notch are supplied by the
 * frame. Give top content some `pt` so it clears the notch.
 */
export const MockupPhone = React.forwardRef<HTMLDivElement, MockupPhoneProps>(
  function MockupPhone({ className, children, ...rest }, ref) {
    const sc = useSilicaClass();
    return (
      <div ref={ref} className={cx(sc("mockup-phone"), className)} {...rest}>
        <div className={cx(sc("mockup-phone-display"))}>{children}</div>
      </div>
    );
  },
);
