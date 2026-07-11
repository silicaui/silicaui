/**
 * Chrome primitives shared by BOTH builder shells (site `Builder.tsx` and
 * email `EmailBuilder.tsx`) — a mode/tab toggle item and a rail section
 * header bar. Kept here (not duplicated per-builder) so a chrome tweak to
 * one applies to both automatically instead of silently drifting apart.
 */
import * as React from "react";
import { ToggleGroupItem } from "@wizeworks/silicaui-react";
import { Icon } from "./Icon";
import type { IconName } from "../icons";

/** Toggle item with a leading icon — a flex row so icon + label align. */
export function IconItem({
  value,
  icon: name,
  className,
  children,
}: {
  value: string;
  icon: IconName;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <ToggleGroupItem value={value} className={className}>
      <span className="inline-flex items-center justify-center gap-1.5">
        <Icon name={name} /> {children}
      </span>
    </ToggleGroupItem>
  );
}

/** A panel header bar (left/right rails). `theme` tints it for the site
 *  builder's Theme mode; email never passes it. */
export function PanelHead({ children, theme }: { children: React.ReactNode; theme?: boolean }) {
  return (
    <div
      className={`flex items-center gap-1.5 h-10 flex-none px-3.5 border-b border-base-200 text-sm font-semibold ${
        theme ? "bg-linear-to-r from-primary/12 to-transparent" : ""
      }`}
    >
      {children}
    </div>
  );
}
