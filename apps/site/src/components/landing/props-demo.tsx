"use client";

import { useState } from "react";
import { Badge, Button, ToggleGroup, ToggleGroupItem } from "@wizeworks/silicaui-react";

/**
 * Props in, real classes out — driven by the visitor.
 *
 * Both the code sample and the rendered components read the same two pieces of
 * state, so what's written and what's shown can't drift. The point being made
 * is that `color` and `variant` are not a bespoke styling layer: they resolve
 * to the plugin's actual `btn btn-<color> btn-<variant>` classes, which is why
 * the same props work on Badge, Alert, Progress and everything else.
 *
 * Uses silicaui's own `.mockup-code` frame rather than a hand-built window —
 * it's a shipped component, so this section dogfoods too.
 */

const COLORS = ["accent", "primary", "success", "error"] as const;
const VARIANTS = ["solid", "outline", "soft", "ghost"] as const;

type Color = (typeof COLORS)[number];
type Variant = (typeof VARIANTS)[number];

export function PropsDemo() {
  const [color, setColor] = useState<Color>("accent");
  const [variant, setVariant] = useState<Variant>("solid");

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-stretch">
      {/* Controls + live result */}
      <div className="flex flex-col gap-6 rounded-box border border-base-300 bg-base-100 p-6">
        <div className="flex flex-col gap-3">
          <span className="text-sm font-semibold text-base-content">color</span>
          <ToggleGroup
            value={[color]}
            onValueChange={(v: unknown) => {
              const next = Array.isArray(v) ? v[0] : v;
              if (typeof next === "string" && next) setColor(next as Color);
            }}
            className="toggle-group-sm w-fit"
            aria-label="Button color"
          >
            {COLORS.map((c) => (
              <ToggleGroupItem key={c} value={c}>
                {c}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-sm font-semibold text-base-content">variant</span>
          <ToggleGroup
            value={[variant]}
            onValueChange={(v: unknown) => {
              const next = Array.isArray(v) ? v[0] : v;
              if (typeof next === "string" && next) setVariant(next as Variant);
            }}
            className="toggle-group-sm w-fit"
            aria-label="Button variant"
          >
            {VARIANTS.map((v) => (
              <ToggleGroupItem key={v} value={v}>
                {v}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-3 border-t border-base-300 pt-6">
          <Button color={color} variant={variant} size="lg">
            Deploy
          </Button>
          <Badge color={color} variant={variant === "ghost" ? "soft" : variant}>
            Live
          </Badge>
        </div>
      </div>

      {/* The code that produces it */}
      <div className="mockup-code overflow-x-auto text-sm">
        <pre data-prefix="1">
          <code>{`<Button color="${color}" variant="${variant}">`}</code>
        </pre>
        <pre data-prefix="2">
          <code>{"  Deploy"}</code>
        </pre>
        <pre data-prefix="3">
          <code>{"</Button>"}</code>
        </pre>
        <pre data-prefix="4">
          <code> </code>
        </pre>
        <pre data-prefix="5">
          <code>{`<Badge color="${color}" variant="${variant === "ghost" ? "soft" : variant}">`}</code>
        </pre>
        <pre data-prefix="6">
          <code>{"  Live"}</code>
        </pre>
        <pre data-prefix="7">
          <code>{"</Badge>"}</code>
        </pre>
      </div>
    </div>
  );
}
