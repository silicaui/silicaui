/**
 * The Component board (center in Theme mode) — every token edit previews across
 * the whole silicaui library AT ONCE, so a theme can be JUDGED, not guessed. It
 * dogfoods real silicaui-react components inside a `[data-theme]` island carrying
 * the document theme's vars + the runtime color cascade (same island the canvas
 * uses), so N named colors and every scalar token repaint live. Layout is Tailwind;
 * component look comes entirely from silicaui's classes. The page leaves the screen
 * here — this surface IS the theme.
 */
import * as React from "react";
import type { Theme } from "silicaui-html";
import { rolesOf } from "silicaui-html";
import {
  Button, Badge, Alert, AlertContent, AlertTitle,
  Progress, RadialProgress, Range, Switch, Rating,
  Stats, Stat, StatTitle, StatValue, StatDesc,
  Avatar, AvatarGroup, Input, Table,
  Tabs, TabsList, TabsTab, TabsPanel,
  Steps, Step, Card, CardBody, CardTitle, CardActions,
  Display, Heading, Text,
} from "silicaui-react";
import { useTheme } from "./editor-context";
import { customColorCss } from "../color-cascade";

function themeVars(theme: Theme): React.CSSProperties {
  const tokens: Record<string, string> = { ...theme.tokens, ...(theme.mode === "dark" ? theme.dark : undefined) };
  const style: Record<string, string> = {};
  for (const [k, v] of Object.entries(tokens)) if (k.startsWith("--")) style[k] = String(v);
  return style as React.CSSProperties;
}

const CARD = "mb-4 inline-block w-full break-inside-avoid rounded-box border border-base-300 bg-base-100 p-4 shadow-[0_2px_12px_rgba(20,20,40,0.05)]";
const CARD_H = "mb-3 flex items-center gap-2 text-sm font-semibold";

// A neutral gradient preview so the product card has real media (no external fetch).
const PREVIEW_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='100'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%23ede9fe'/%3E%3Cstop offset='.55' stop-color='%23dcd0fb'/%3E%3Cstop offset='1' stop-color='%23c7d2fe'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='160' height='100' fill='url(%23g)'/%3E%3Ccircle cx='120' cy='34' r='16' fill='%23fff' opacity='.5'/%3E%3Crect x='24' y='64' width='96' height='7' rx='3.5' fill='%23fff' opacity='.6'/%3E%3C/svg%3E";

const ORDERS: Array<{ name: string; status: string; color: "info" | "error" | "warning" | "success" }> = [
  { name: "Charlie Chapman", status: "Sent", color: "info" },
  { name: "Howard Hudson", status: "Failed", color: "error" },
  { name: "Fiona Fisher", status: "In progress", color: "warning" },
  { name: "Amanda Anderson", status: "Completed", color: "success" },
];

function BoardCard({ title, aside, children }: { title: string; aside?: string; children: React.ReactNode }) {
  return (
    <div className={CARD}>
      <div className={CARD_H}>
        <span>{title}</span>
        {aside && <span className="ml-auto font-medium text-xs text-base-content/45">{aside}</span>}
      </div>
      {children}
    </div>
  );
}

export function ComponentBoard() {
  const theme = useTheme();
  const customCss = React.useMemo(() => customColorCss(theme, ".sui-brd"), [theme]);
  const roles = rolesOf(theme).slice(0, 6);

  return (
    <div className="sui-brd flex-1 min-h-0 overflow-auto p-6 bg-base-200 text-base-content @container" data-theme={theme.name} style={themeVars(theme)}>
      {customCss && <style dangerouslySetInnerHTML={{ __html: customCss }} />}
      <div className="mb-4 flex items-baseline gap-2 flex-wrap text-sm text-base-content/55">
        <b className="text-md text-base-content">Component board</b>
        <span>— every token change previews here, across the whole library at once. This is how you judge a theme.</span>
      </div>

      <div className="columns-2 @5xl:columns-3 gap-4">
        <BoardCard title="Typography" aside="ramp · font">
          <Display className="text-3xl">Ship faster</Display>
          <Heading level={1} className="mt-2 text-xl">Heading one</Heading>
          <Heading level={3} className="mt-1">Heading three</Heading>
          <Text variant="lead" className="mt-2">A lead paragraph introduces the section with a touch more size.</Text>
          <Text className="mt-2">Body copy sits at the 16px base — the world-standard reading size — with comfortable line height.</Text>
          <Text variant="caption" className="mt-1">Caption · muted supporting text</Text>
        </BoardCard>

        <BoardCard title="Buttons" aside="variants · sizes · states">
          <div className="flex flex-wrap gap-2">
            <Button color="primary" size="sm">Primary</Button>
            <Button color="secondary" size="sm">Secondary</Button>
            <Button color="accent" size="sm">Accent</Button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button color="neutral" size="sm">Neutral</Button>
            <Button variant="outline" size="sm">Outline</Button>
            <Button variant="ghost" size="sm">Ghost</Button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button color="primary" size="sm">Normal</Button>
            <Button color="primary" size="sm" disabled>Disabled</Button>
          </div>
        </BoardCard>

        <BoardCard title="Badges">
          <div className="flex flex-wrap gap-2">
            <Badge color="primary">primary</Badge>
            <Badge color="secondary">secondary</Badge>
            <Badge color="accent">accent</Badge>
            <Badge>ghost</Badge>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge color="success">success</Badge>
            <Badge color="warning">warning</Badge>
            <Badge color="error">error</Badge>
            <Badge color="info">info</Badge>
          </div>
        </BoardCard>

        <BoardCard title="Alerts">
          <div className="grid gap-2">
            <Alert color="info" variant="soft"><AlertContent><AlertTitle>A new update is available.</AlertTitle></AlertContent></Alert>
            <Alert color="success" variant="soft"><AlertContent><AlertTitle>Your purchase was confirmed.</AlertTitle></AlertContent></Alert>
            <Alert color="warning" variant="soft"><AlertContent><AlertTitle>Your storage is almost full.</AlertTitle></AlertContent></Alert>
            <Alert color="error" variant="soft"><AlertContent><AlertTitle>Payment could not be processed.</AlertTitle></AlertContent></Alert>
          </div>
        </BoardCard>

        <BoardCard title="Metrics">
          <Stats>
            <Stat>
              <StatTitle>July revenue</StatTitle>
              <StatValue>$32,400</StatValue>
              <StatDesc>↗︎ 21% vs last month</StatDesc>
            </Stat>
          </Stats>
          <div className="mt-3">
            <Progress color="primary" value={72} max={100} />
          </div>
        </BoardCard>

        <BoardCard title="Progress">
          <div className="flex items-center gap-4">
            <RadialProgress value={91} color="primary" />
            <div className="flex-1 grid gap-2">
              <Progress color="success" value={88} max={100} />
              <Progress color="warning" value={54} max={100} />
              <Progress color="error" value={26} max={100} />
            </div>
          </div>
        </BoardCard>

        <BoardCard title="Form fields">
          <Input placeholder="Search events…" />
          <div className="mt-3 flex items-center justify-between">
            <Rating defaultValue={4} color="warning" />
            <Switch defaultChecked color="primary" />
          </div>
          <div className="mt-3">
            <Range defaultValue={58} color="primary" />
          </div>
        </BoardCard>

        <BoardCard title="Palette" aside="every named role — incl. custom">
          <div className="flex flex-wrap gap-2">
            {/* Buttons: the runtime cascade emits `btn-<role>` for custom colors too,
                so an invented `brand` role paints here exactly like a built-in. */}
            {roles.map((r) => (
              <Button key={r} color={r as never} size="sm">{r}</Button>
            ))}
          </div>
        </BoardCard>

        <BoardCard title="Tabs">
          <Tabs defaultValue="overview" variant="boxed" color="primary">
            <TabsList>
              <TabsTab value="overview">Overview</TabsTab>
              <TabsTab value="activity">Activity</TabsTab>
              <TabsTab value="settings">Settings</TabsTab>
            </TabsList>
            <TabsPanel value="overview" className="pt-3 text-sm text-base-content/80">
              Panels inherit the theme's surface, border, and radius tokens.
            </TabsPanel>
            <TabsPanel value="activity" className="pt-3 text-sm text-base-content/80">
              12 events in the last hour.
            </TabsPanel>
            <TabsPanel value="settings" className="pt-3 text-sm text-base-content/80">
              Preferences, notifications, and access.
            </TabsPanel>
          </Tabs>
        </BoardCard>

        <BoardCard title="Recent orders">
          <Table zebra>
            <tbody>
              {ORDERS.map((o) => (
                <tr key={o.name}>
                  <td>{o.name}</td>
                  <td className="text-right">
                    <Badge color={o.color}>{o.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </BoardCard>

        <BoardCard title="Checkout" aside="steps">
          <Steps>
            <Step color="primary" data-content="✓">Cart</Step>
            <Step color="primary" data-content="✓">Address</Step>
            <Step color="primary">Payment</Step>
            <Step>Done</Step>
          </Steps>
        </BoardCard>

        <div className={`${CARD} !p-0 overflow-hidden`}>
          <img src={PREVIEW_IMG} alt="" className="block w-full aspect-[16/10] object-cover" />
          <Card className="border-0 bg-transparent shadow-none">
            <CardBody className="p-4">
              <div className="flex items-center gap-2">
                <Badge color="accent">New</Badge>
                <span className="text-sm text-base-content/50">Audio</span>
              </div>
              <CardTitle className="text-sm">Wireless Studio Headphones</CardTitle>
              <CardActions className="mt-1 items-center justify-between">
                <span className="text-md font-bold">$149</span>
                <Button color="primary" size="sm">Add to cart</Button>
              </CardActions>
            </CardBody>
          </Card>
        </div>

        <BoardCard title="Team">
          <AvatarGroup>
            <Avatar color="primary" alt="Charlie">CC</Avatar>
            <Avatar color="secondary" alt="Howard">HH</Avatar>
            <Avatar color="accent" alt="Fiona">FF</Avatar>
            <Avatar color="warning" alt="Amanda">AA</Avatar>
            <Avatar alt="More">+3</Avatar>
          </AvatarGroup>
          <div className="mt-3 flex gap-2">
            <Button variant="outline" size="sm">Invite</Button>
            <Button variant="ghost" size="sm">Manage</Button>
          </div>
        </BoardCard>
      </div>
    </div>
  );
}
