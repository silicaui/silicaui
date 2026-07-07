import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import { Button } from "./button";
import type { SilicaColor } from "./lib/tokens";

export interface WizardStep {
  /** Stable identity + React key. */
  id: string;
  /** Step label under the marker. */
  title: React.ReactNode;
  /** Content shown when this step is active (unless `children` is provided). */
  content?: React.ReactNode;
  /** Marks the step "Optional" under its label. */
  optional?: boolean;
  /** Can't be navigated to. */
  disabled?: boolean;
}

export interface WizardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  steps: WizardStep[];
  /** Controlled active step index. */
  activeStep?: number;
  /** Uncontrolled initial step index. Default `0`. */
  defaultStep?: number;
  onStepChange?: (index: number) => void;
  /** Accent color for markers + rail. */
  color?: SilicaColor;
  /**
   * Linear flow: markers can only jump backward (revisit) or stay; forward is via
   * Next. `false` lets any enabled step be clicked. Default `true`.
   */
  linear?: boolean;
  /** Gate the Next button (e.g. until the active step validates). Default `true`. */
  canGoNext?: boolean;
  /** Called when Next is pressed on the last step. */
  onFinish?: () => void;
  backLabel?: string;
  nextLabel?: string;
  finishLabel?: string;
  /** Hide the built-in Back / Next footer. */
  hideFooter?: boolean;
  /** Render your own content instead of the active step's `content`. */
  children?: React.ReactNode;
}

const CheckIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

/**
 * Wizard — a multi-step flow with a numbered indicator, per-step content, and a
 * Back / Next-or-Finish footer. Control the step via `activeStep`/`onStepChange`
 * or run uncontrolled with `defaultStep`. Steps carry their own `content`, or
 * pass `children` to render the body yourself. `canGoNext` gates advancing so you
 * can require the current step to validate first.
 */
export const Wizard = React.forwardRef<HTMLDivElement, WizardProps>(
  function Wizard(
    {
      steps,
      activeStep,
      defaultStep = 0,
      onStepChange,
      color,
      linear = true,
      canGoNext = true,
      onFinish,
      backLabel = "Back",
      nextLabel = "Next",
      finishLabel = "Finish",
      hideFooter,
      children,
      className,
      ...rest
    },
    forwardedRef,
  ) {
    const sc = useSilicaClass();
    const isControlled = activeStep !== undefined;
    const [internal, setInternal] = React.useState(defaultStep);
    const current = isControlled ? activeStep : internal;
    const lastIndex = steps.length - 1;
    const isLast = current >= lastIndex;

    const goTo = (index: number) => {
      const clamped = Math.max(0, Math.min(lastIndex, index));
      if (clamped === current) return;
      if (!isControlled) setInternal(clamped);
      onStepChange?.(clamped);
    };

    const next = () => {
      if (isLast) onFinish?.();
      else goTo(current + 1);
    };
    const back = () => goTo(current - 1);

    const activeContent = children ?? steps[current]?.content;

    return (
      <div
        ref={forwardedRef}
        className={cx(sc("wizard"), color && sc(`wizard-${color}`), className)}
        {...rest}
      >
        <div className={cx(sc("wizard-steps"))} role="list">
          {steps.map((step, i) => {
            const state =
              i < current ? "complete" : i === current ? "active" : "upcoming";
            const clickable =
              !step.disabled && i !== current && (!linear || i < current);
            return (
              <button
                key={step.id}
                type="button"
                className={cx(sc("wizard-step"))}
                role="listitem"
                data-state={state}
                data-clickable={clickable || undefined}
                data-disabled={step.disabled || undefined}
                aria-current={i === current ? "step" : undefined}
                disabled={!clickable}
                onClick={() => clickable && goTo(i)}
              >
                <span className={cx(sc("wizard-step-marker"))}>
                  {state === "complete" ? CheckIcon : i + 1}
                </span>
                <span className={cx(sc("wizard-step-label"))}>
                  {step.title}
                  {step.optional && (
                    <span className={cx(sc("wizard-step-optional"))}>
                      Optional
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        <div className={cx(sc("wizard-content"))}>{activeContent}</div>

        {!hideFooter && (
          <div className={cx(sc("wizard-footer"))}>
            <Button variant="ghost" disabled={current === 0} onClick={back}>
              {backLabel}
            </Button>
            <Button
              color={color}
              disabled={!isLast && !canGoNext}
              onClick={next}
            >
              {isLast ? finishLabel : nextLabel}
            </Button>
          </div>
        )}
      </div>
    );
  },
);
