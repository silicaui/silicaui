"use client";

import type { ReactNode } from "react";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Checkbox,
  Input,
  Kbd,
  Progress,
  RadialProgress,
  Rating,
  Slider,
  Status,
  Switch,
  ToggleGroup,
  ToggleGroupItem,
} from "@wizeworks/silicaui-react";

/**
 * Three columns of REAL components scrolling vertically.
 *
 * The wall lives inside `ThemeWall`'s `data-theme` island, so that section's
 * theme toggle recolors every component in it live. That's the distinction
 * worth keeping: peers who do this ship a tall pre-rendered image of their
 * components, which can never re-theme, can never be interacted with, and goes
 * stale the moment a component changes. These are the actual shipped
 * components — they re-theme because they read the same tokens everything else
 * does.
 *
 * `aria-hidden` on the whole wall: it's ambient product texture beside the
 * real copy, and the duplicated track would otherwise read every label twice
 * to a screen reader. The interactive versions live on the docs pages.
 */

function Tile({ children }: { children: ReactNode }) {
  return (
    <Card className="rounded-box border border-base-300 bg-base-100 p-4 shadow-sm">{children}</Card>
  );
}

const COLUMN_A: ReactNode[] = [
  <Tile key="a1">
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold text-base-content">Deployment</p>
      <Progress value={72} max={100} color="accent" />
      <p className="text-sm text-base-content">72% complete</p>
    </div>
  </Tile>,
  <Tile key="a2">
    <div className="flex flex-wrap gap-2">
      <Badge color="success" variant="soft">Passing</Badge>
      <Badge color="warning" variant="soft">Flaky</Badge>
      <Badge color="error" variant="soft">Failed</Badge>
      <Badge color="info" variant="soft">Queued</Badge>
    </div>
  </Tile>,
  <Tile key="a3">
    <Alert color="success" variant="soft">Build published to production.</Alert>
  </Tile>,
  <Tile key="a4">
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-base-content">Auto-deploy</span>
      <Switch defaultChecked color="accent" />
    </div>
  </Tile>,
  <Tile key="a5">
    <div className="flex items-center gap-3">
      {/* No `src` — the initials fallback is the point, and it's a themed
          surface rather than an empty hole. */}
      <Avatar color="accent" status="online">
        AL
      </Avatar>
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-base-content">Ada Lovelace</span>
        <span className="text-sm text-base-content">Maintainer</span>
      </div>
    </div>
  </Tile>,
  <Tile key="a6">
    <div className="flex items-center gap-2">
      <Kbd>⌘</Kbd>
      <Kbd>K</Kbd>
      <span className="text-sm text-base-content">Command palette</span>
    </div>
  </Tile>,
];

const COLUMN_B: ReactNode[] = [
  <Tile key="b1">
    <div className="flex items-center justify-center">
      <RadialProgress value={68} color="accent" />
    </div>
  </Tile>,
  <Tile key="b2">
    <div className="flex flex-col gap-3">
      <Input placeholder="you@example.com" />
      <Button color="primary" size="sm" block>
        Subscribe
      </Button>
    </div>
  </Tile>,
  <Tile key="b3">
    <div className="flex flex-col gap-2">
      <span className="text-sm text-base-content">Volume</span>
      <Slider defaultValue={45} color="accent" />
    </div>
  </Tile>,
  <Tile key="b4">
    <Alert color="warning" variant="soft">Certificate expires in 7 days.</Alert>
  </Tile>,
  <Tile key="b5">
    {/* Checkbox is a bare restyled <input>, so the text goes in a real
        <label> beside it rather than as children. */}
    <div className="flex flex-col gap-2">
      <label className="flex items-center gap-2 text-sm text-base-content">
        <Checkbox defaultChecked color="accent" />
        Run tests on push
      </label>
      <label className="flex items-center gap-2 text-sm text-base-content">
        <Checkbox />
        Require review
      </label>
    </div>
  </Tile>,
  <Tile key="b6">
    <div className="flex flex-wrap gap-2">
      <Button color="primary" size="sm">Primary</Button>
      <Button variant="outline" size="sm">Outline</Button>
      <Button variant="ghost" size="sm">Ghost</Button>
    </div>
  </Tile>,
];

const COLUMN_C: ReactNode[] = [
  <Tile key="c1">
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-base-content">Region status</span>
      <div className="flex items-center gap-2">
        <Status color="success" ping label="Online" />
        <span className="text-sm text-base-content">us-east-1</span>
      </div>
      <div className="flex items-center gap-2">
        <Status color="warning" label="Degraded" />
        <span className="text-sm text-base-content">eu-west-2</span>
      </div>
    </div>
  </Tile>,
  <Tile key="c2">
    <div className="flex flex-col gap-2">
      <span className="text-sm text-base-content">Rating</span>
      <Rating defaultValue={4} />
    </div>
  </Tile>,
  <Tile key="c3">
    <Alert color="info" variant="soft">A new version of the CLI is available.</Alert>
  </Tile>,
  <Tile key="c4">
    <div className="flex flex-col gap-2">
      <Progress value={40} max={100} color="secondary" />
      <Progress value={88} max={100} color="success" />
      <Progress value={22} max={100} color="error" />
    </div>
  </Tile>,
  <Tile key="c5">
    <ToggleGroup defaultValue={["list"]} className="toggle-group-sm">
      <ToggleGroupItem value="list">List</ToggleGroupItem>
      <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
      <ToggleGroupItem value="board">Board</ToggleGroupItem>
    </ToggleGroup>
  </Tile>,
  <Tile key="c6">
    <div className="flex flex-col gap-1">
      <span className="text-3xl font-semibold text-base-content">12,480</span>
      <span className="text-sm text-base-content">Weekly downloads</span>
    </div>
  </Tile>,
];

function Column({ items, speed }: { items: ReactNode[]; speed: string }) {
  return (
    <div className="flex flex-col gap-4 overflow-hidden">
      <div className={`wall-track ${speed} flex flex-col gap-4`}>
        {items}
        {/* The duplicate is what makes -50% land exactly on a loop seam. */}
        {items.map((node, i) => (
          <div key={`dup-${i}`}>{node}</div>
        ))}
      </div>
    </div>
  );
}

export function ComponentWall() {
  return (
    <div
      aria-hidden="true"
      className="wall-mask grid h-[34rem] grid-cols-2 gap-4 overflow-hidden lg:h-[42rem] lg:grid-cols-3"
    >
      <Column items={COLUMN_A} speed="wall-slow" />
      <Column items={COLUMN_B} speed="wall-mid" />
      {/* Third column only where there's width for it — two dense columns beat
          three cramped ones on a narrow viewport. */}
      <div className="hidden lg:flex lg:flex-col lg:overflow-hidden">
        <Column items={COLUMN_C} speed="wall-fast" />
      </div>
    </div>
  );
}
