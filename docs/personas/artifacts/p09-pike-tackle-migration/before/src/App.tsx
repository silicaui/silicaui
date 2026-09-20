/**
 * Pike & Daughter Tackle — shop admin. THE BEFORE.
 *
 * Six years old, built on daisyUI from the start, and it works. Nothing here is
 * a demonstration of daisyUI; it is an ordinary admin written the ordinary way,
 * which is the only kind of app a migration cost means anything on.
 *
 * Eight screens, reached from one rail: products, one product, orders, one
 * order, customers, stock take, settings, sign in.
 */
import * as React from "react";
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
  const go = React.useCallback((r: Route) => {
    writeRoute(r);
    setRoute(r);
  }, []);
  React.useEffect(() => {
    const onPop = () => setRoute(readRoute());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  if (route.name === "signin") return <SignIn go={go} />;

  return (
    <div className="drawer lg:drawer-open h-full">
      <input id="rail" type="checkbox" className="drawer-toggle" />

      <div className="drawer-content flex min-h-0 flex-col">
        <div className="navbar border-b border-base-300 bg-base-200">
          <label htmlFor="rail" className="btn btn-ghost btn-sm drawer-button lg:hidden">
            Menu
          </label>
          <span className="ml-2 text-lg font-bold">Pike &amp; Daughter Tackle</span>
          <span className="flex-1" />
          <div className="tooltip tooltip-bottom" data-tip="Signed in as gordon@pikeanddaughter.co.uk">
            <div className="avatar avatar-placeholder">
              <div className="w-8 rounded-full bg-neutral text-neutral-content">
                <span className="text-xs">GP</span>
              </div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm ml-2" onClick={() => go({ name: "signin" })}>
            Sign out
          </button>
        </div>

        <main className="min-h-0 flex-1 overflow-auto bg-base-100 p-4">
          {route.name === "products" && <Products go={go} />}
          {route.name === "product" && <ProductEdit sku={route.sku} go={go} />}
          {route.name === "orders" && <Orders go={go} />}
          {route.name === "order" && <OrderDetail id={route.id} go={go} />}
          {route.name === "customers" && <Customers />}
          {route.name === "stock" && <StockTake />}
          {route.name === "settings" && <Settings />}
        </main>
      </div>

      <div className="drawer-side">
        <label htmlFor="rail" aria-label="close" className="drawer-overlay" />
        <ul className="menu min-h-full w-56 bg-base-200 p-3 text-base">
          <li className="menu-title">Shop admin</li>
          {NAV.map((n) => (
            <li key={n.label}>
              <a
                className={route.name === n.route.name ? "menu-active" : ""}
                href={`?screen=${n.route.name}`}
                onClick={(e) => {
                  e.preventDefault();
                  go(n.route);
                }}
              >
                {n.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
