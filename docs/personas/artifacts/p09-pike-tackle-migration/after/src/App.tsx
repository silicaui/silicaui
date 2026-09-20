/**
 * Pike & Daughter Tackle — shop admin. THE AFTER.
 *
 * The same eight screens, the same behaviour, the same routing. No screen was
 * rewritten; each one had its daisyUI classes swapped for Silica components and
 * was left otherwise alone, which is the only kind of migration a shop with a
 * client can pay for.
 *
 * MIGRATION NOTE — THE SHELL IS WHERE THE REAL COST IS.
 *
 * daisyUI's `drawer` is a CSS-only pattern: a hidden checkbox, a `drawer-side`,
 * a `drawer-overlay` label, and `lg:drawer-open` to pin it open on a desktop.
 * Silica has `AppShell` + `Sidebar`, which is a layout rather than a checkbox
 * trick, so this is the one part of the app that is not a class swap. It is also
 * the part that got the most back: the rail no longer needs a checkbox in the
 * markup, and it is one component instead of six coordinated class names.
 */
import * as React from "react";
import {
  AppShell,
  AppShellHeader,
  AppShellMain,
  AppShellSidebar,
  Avatar,
  Button,
  Menu,
  MenuItem,
  MenuTitle,
  Tooltip,
} from "@wizeworks/silicaui-react";
import {
  Products,
  ProductEdit,
  Orders,
  OrderDetail,
  Customers,
  StockTake,
  Settings,
  SignIn,
} from "./screens";

export type Route =
  | { name: "products" }
  | { name: "product"; sku: string }
  | { name: "orders" }
  | { name: "order"; id: string }
  | { name: "customers" }
  | { name: "stock" }
  | { name: "settings" }
  | { name: "signin" };

const NAV: { label: string; route: Route }[] = [
  { label: "Products", route: { name: "products" } },
  { label: "Orders", route: { name: "orders" } },
  { label: "Customers", route: { name: "customers" } },
  { label: "Stock take", route: { name: "stock" } },
  { label: "Settings", route: { name: "settings" } },
];

function readRoute(): Route {
  const p = new URLSearchParams(window.location.search);
  const name = p.get("screen") ?? "products";
  if (name === "product") return { name: "product", sku: p.get("sku") ?? "PD-4471" };
  if (name === "order") return { name: "order", id: p.get("id") ?? "PD-ORD-8841" };
  if (["orders", "customers", "stock", "settings", "signin"].includes(name)) {
    return { name } as Route;
  }
  return { name: "products" };
}

function writeRoute(r: Route) {
  const p = new URLSearchParams();
  p.set("screen", r.name);
  if (r.name === "product") p.set("sku", r.sku);
  if (r.name === "order") p.set("id", r.id);
  window.history.pushState(null, "", `?${p.toString()}`);
}

export function App() {
  const [route, setRoute] = React.useState<Route>(() => readRoute());
  const [railOpen, setRailOpen] = React.useState(false);
  const go = React.useCallback((r: Route) => {
    writeRoute(r);
    setRoute(r);
    setRailOpen(false);
  }, []);
  React.useEffect(() => {
    const onPop = () => setRoute(readRoute());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  if (route.name === "signin") return <SignIn go={go} />;

  return (
    <AppShell className="h-full">
      <AppShellSidebar
        className={`w-56 border-r border-base-300 bg-base-200 ${railOpen ? "" : "max-lg:hidden"}`}
      >
        <Menu className="p-3 text-base">
          <MenuTitle>Shop admin</MenuTitle>
          {NAV.map((n) => (
            <MenuItem key={n.label}>
              <a
                href={`?screen=${n.route.name}`}
                aria-current={route.name === n.route.name ? "page" : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  go(n.route);
                }}
              >
                {n.label}
              </a>
            </MenuItem>
          ))}
        </Menu>
      </AppShellSidebar>

      <AppShellHeader className="flex items-center gap-2 border-b border-base-300 bg-base-200 px-3 py-2">
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden"
          aria-expanded={railOpen}
          onClick={() => setRailOpen((v) => !v)}
        >
          Menu
        </Button>
        <span className="text-lg font-bold">Pike &amp; Daughter Tackle</span>
        <span className="flex-1" />
        {/* daisyUI needed `avatar avatar-placeholder` on a wrapper and a sized
            `<div class="w-8 rounded-full bg-neutral">` inside it to show two
            initials. Silica takes the initials as children and the label as
            `alt`, and announces the person rather than "GP". */}
        <Tooltip content="Signed in as gordon@pikeanddaughter.co.uk">
          <Avatar size="sm" color="neutral" alt="Gordon Pike">
            GP
          </Avatar>
        </Tooltip>
        <Button variant="ghost" size="sm" onClick={() => go({ name: "signin" })}>
          Sign out
        </Button>
      </AppShellHeader>

      <AppShellMain className="min-h-0 overflow-auto bg-base-100 p-4">
        {route.name === "products" && <Products go={go} />}
        {route.name === "product" && <ProductEdit sku={route.sku} go={go} />}
        {route.name === "orders" && <Orders go={go} />}
        {route.name === "order" && <OrderDetail id={route.id} go={go} />}
        {route.name === "customers" && <Customers />}
        {route.name === "stock" && <StockTake />}
        {route.name === "settings" && <Settings />}
      </AppShellMain>
    </AppShell>
  );
}
