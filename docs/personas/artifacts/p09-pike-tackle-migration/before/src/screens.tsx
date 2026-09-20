/**
 * The eight screens, on daisyUI.
 *
 * Ordinary shop-admin code: a list that pages, an edit form that saves, a detail
 * view, a count sheet, a settings page and a sign-in. Between them they use the
 * daisyUI classes this admin actually leans on, which is the set the migration
 * ledger has to account for.
 *
 * `form-control` is still on every field and does nothing: daisyUI removed it in
 * v5 and the labels have laid out inline ever since. Every one of them carries a
 * `flex flex-col gap-1` that was added the week of that upgrade. That is not a
 * complaint, it is what a six-year-old app looks like, and it is left in so the
 * BEFORE is a fair baseline rather than a straw man.
 */
import * as React from "react";
import type { Route } from "./App";
import {
  CATEGORIES,
  CUSTOMERS,
  ORDERS,
  PRODUCTS,
  money,
  stockLabel,
  type Product,
} from "./data";

type Go = (r: Route) => void;
const PAGE = 12;

/** The colour a stock figure gets. Never the only signal — the words differ too. */
function stockBadge(stock: number | null): string {
  if (stock === null) return "badge badge-ghost";
  if (stock === 0) return "badge badge-error";
  if (stock < 5) return "badge badge-warning";
  return "badge badge-success";
}

// ── 1. Products ──────────────────────────────────────────────────────────────

export function Products({ go }: { go: Go }) {
  const [q, setQ] = React.useState("");
  const [cat, setCat] = React.useState("All");
  const [page, setPage] = React.useState(0);

  const rows = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    return PRODUCTS.filter(
      (p) =>
        (cat === "All" || p.category === cat) &&
        (!needle || p.name.toLowerCase().includes(needle) || p.sku.toLowerCase().includes(needle)),
    );
  }, [q, cat]);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const shown = rows.slice(page * PAGE, page * PAGE + PAGE);

  return (
    <div className="flex flex-col gap-4">
      <div className="breadcrumbs text-sm">
        <ul>
          <li>Shop admin</li>
          <li>Products</li>
        </ul>
      </div>

      <div className="stats stats-vertical border border-base-300 sm:stats-horizontal">
        <div className="stat">
          <div className="stat-title">Products</div>
          <div className="stat-value text-2xl">{PRODUCTS.length}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Out of stock</div>
          <div className="stat-value text-2xl">{PRODUCTS.filter((p) => p.stock === 0).length}</div>
          <div className="stat-desc">counted, and none left</div>
        </div>
        <div className="stat">
          <div className="stat-title">Never counted</div>
          <div className="stat-value text-2xl">{PRODUCTS.filter((p) => p.stock === null).length}</div>
          <div className="stat-desc">not the same as none</div>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <label className="form-control flex flex-col gap-1">
          <span className="label-text">Search</span>
          <input
            className="input input-bordered input-sm w-60"
            placeholder="SKU or product"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(0);
            }}
          />
        </label>
        <label className="form-control flex flex-col gap-1">
          <span className="label-text">Category</span>
          <select
            className="select select-bordered select-sm"
            value={cat}
            onChange={(e) => {
              setCat(e.target.value);
              setPage(0);
            }}
          >
            <option>All</option>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <span className="flex-1" />
        <button className="btn btn-primary btn-sm" onClick={() => go({ name: "product", sku: "PD-4471" })}>
          New product
        </button>
      </div>

      <div className="overflow-x-auto rounded-box border border-base-300">
        <table className="table table-zebra table-sm">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Product</th>
              <th className="text-right">Price</th>
              <th className="text-right">Stock</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {shown.map((p) => (
              <tr key={p.sku}>
                <td className="font-mono">{p.sku}</td>
                <td className="max-w-[24rem] truncate" title={p.name}>
                  {p.name}
                </td>
                <td className="text-right tabular-nums">{money(p.pricePence)}</td>
                <td className="text-right">
                  <span className={stockBadge(p.stock)}>{stockLabel(p.stock)}</span>
                </td>
                <td className="text-right">
                  <button className="btn btn-ghost btn-xs" onClick={() => go({ name: "product", sku: p.sku })}>
                    Edit
                  </button>
                </td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr>
                <td colSpan={5}>
                  <div className="alert alert-warning">
                    <span>Nothing matches that. Clear the search or pick another category.</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm opacity-70">
          {rows.length} of {PRODUCTS.length}
        </span>
        <span className="flex-1" />
        <div className="join">
          <button className="btn btn-sm join-item" disabled={page === 0} onClick={() => setPage((n) => n - 1)}>
            Previous
          </button>
          <button className="btn btn-sm join-item">
            Page {page + 1} of {pages}
          </button>
          <button
            className="btn btn-sm join-item"
            disabled={page >= pages - 1}
            onClick={() => setPage((n) => n + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 2. One product ───────────────────────────────────────────────────────────

export function ProductEdit({ sku, go }: { sku: string; go: Go }) {
  const product = PRODUCTS.find((p) => p.sku === sku) ?? PRODUCTS[0]!;
  const [draft, setDraft] = React.useState<Product>(product);
  const [saved, setSaved] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);
  React.useEffect(() => {
    setDraft(product);
    setSaved(false);
  }, [product]);

  return (
    <div className="flex flex-col gap-4">
      <div className="breadcrumbs text-sm">
        <ul>
          <li>
            <a
              href="?screen=products"
              onClick={(e) => {
                e.preventDefault();
                go({ name: "products" });
              }}
            >
              Products
            </a>
          </li>
          <li>{draft.sku}</li>
        </ul>
      </div>

      <div className="card border border-base-300 bg-base-200">
        <div className="card-body gap-4">
          <h2 className="card-title">{draft.name}</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="form-control flex flex-col gap-1">
              <span className="label-text">Product name</span>
              <input
                className="input input-bordered"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </label>
            <label className="form-control flex flex-col gap-1">
              <span className="label-text">SKU</span>
              <input className="input input-bordered font-mono" value={draft.sku} readOnly />
            </label>
            <label className="form-control flex flex-col gap-1">
              <span className="label-text">Price, in pounds</span>
              <input
                className="input input-bordered tabular-nums"
                inputMode="decimal"
                value={(draft.pricePence / 100).toFixed(2)}
                onChange={(e) =>
                  setDraft({ ...draft, pricePence: Math.round(Number(e.target.value || 0) * 100) })
                }
              />
            </label>
            <label className="form-control flex flex-col gap-1">
              <span className="label-text">Stock</span>
              <input
                className="input input-bordered tabular-nums"
                inputMode="numeric"
                value={draft.stock === null ? "" : String(draft.stock)}
                placeholder="not counted"
                onChange={(e) =>
                  setDraft({ ...draft, stock: e.target.value === "" ? null : Number(e.target.value) })
                }
              />
            </label>
            <label className="form-control flex flex-col gap-1">
              <span className="label-text">Category</span>
              <select
                className="select select-bordered"
                value={draft.category}
                onChange={(e) => setDraft({ ...draft, category: e.target.value as Product["category"] })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="form-control flex flex-col gap-1">
              <span className="label-text">Supplier</span>
              <input
                className="input input-bordered"
                value={draft.supplier}
                onChange={(e) => setDraft({ ...draft, supplier: e.target.value })}
              />
            </label>
          </div>

          <label className="form-control flex flex-col gap-1">
            <span className="label-text">Shelf note</span>
            <textarea className="textarea textarea-bordered" rows={3} placeholder="Anything the counter needs to know" />
          </label>

          {draft.stock !== null && (Number.isNaN(draft.stock) || draft.stock < 0) && (
            <div className="alert alert-error">
              <span>Stock cannot be negative. It is either a number from zero up, or not counted.</span>
            </div>
          )}

          <div className="card-actions items-center">
            {saved && <span className="badge badge-success">Saved</span>}
            <span className="flex-1" />
            <button className="btn btn-ghost btn-sm" onClick={() => setConfirming(true)}>
              Delete
            </button>
            <button
              className="btn btn-primary btn-sm"
              disabled={draft.stock !== null && (Number.isNaN(draft.stock) || draft.stock < 0)}
              onClick={() => setSaved(true)}
            >
              Save changes
            </button>
          </div>
        </div>
      </div>

      {confirming && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="text-lg font-bold">Delete {draft.sku}?</h3>
            <p className="py-3">
              {draft.name} will be removed from the shop. Orders that already contain it keep it.
            </p>
            <div className="modal-action">
              <button className="btn btn-sm" onClick={() => setConfirming(false)}>
                Keep it
              </button>
              <button className="btn btn-error btn-sm" onClick={() => setConfirming(false)}>
                Delete it
              </button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}

// ── 3. Orders ────────────────────────────────────────────────────────────────

const ORDER_BADGE: Record<string, string> = {
  Paid: "badge badge-info",
  Picking: "badge badge-warning",
  Dispatched: "badge badge-success",
  Refunded: "badge badge-ghost",
};

export function Orders({ go }: { go: Go }) {
  const [tab, setTab] = React.useState<"All" | "Picking" | "Dispatched">("All");
  const rows = ORDERS.filter((o) => tab === "All" || o.status === tab);
  return (
    <div className="flex flex-col gap-4">
      <div className="breadcrumbs text-sm">
        <ul>
          <li>Shop admin</li>
          <li>Orders</li>
        </ul>
      </div>

      <div role="tablist" className="tabs tabs-border">
        {(["All", "Picking", "Dispatched"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            className={`tab ${tab === t ? "tab-active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-box border border-base-300">
        <table className="table table-sm">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Placed</th>
              <th>Status</th>
              <th className="text-right">Total</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id}>
                <td className="font-mono">{o.id}</td>
                <td>{o.customer}</td>
                <td className="tabular-nums">{o.placed}</td>
                <td>
                  <span className={ORDER_BADGE[o.status]}>{o.status}</span>
                </td>
                <td className="text-right tabular-nums">{money(o.totalPence)}</td>
                <td className="text-right">
                  <button className="btn btn-ghost btn-xs" onClick={() => go({ name: "order", id: o.id })}>
                    Open
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── 4. One order ─────────────────────────────────────────────────────────────

export function OrderDetail({ id, go }: { id: string; go: Go }) {
  const order = ORDERS.find((o) => o.id === id) ?? ORDERS[0]!;
  return (
    <div className="flex flex-col gap-4">
      <div className="breadcrumbs text-sm">
        <ul>
          <li>
            <a
              href="?screen=orders"
              onClick={(e) => {
                e.preventDefault();
                go({ name: "orders" });
              }}
            >
              Orders
            </a>
          </li>
          <li>{order.id}</li>
        </ul>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="card border border-base-300 bg-base-200">
          <div className="card-body">
            <h2 className="card-title">What is in it</h2>
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Product</th>
                  <th className="text-right">Qty</th>
                  <th className="text-right">Line</th>
                </tr>
              </thead>
              <tbody>
                {order.lines.map((l) => {
                  const p = PRODUCTS.find((x) => x.sku === l.sku);
                  return (
                    <tr key={l.sku}>
                      <td className="font-mono">{l.sku}</td>
                      <td>{p?.name ?? "unknown product"}</td>
                      <td className="text-right tabular-nums">{l.qty}</td>
                      <td className="text-right tabular-nums">{money((p?.pricePence ?? 0) * l.qty)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="divider my-1" />
            <div className="flex items-baseline justify-between">
              <span className="font-semibold">Total</span>
              <span className="text-xl font-bold tabular-nums">{money(order.totalPence)}</span>
            </div>
          </div>
        </div>

        <div className="card border border-base-300 bg-base-200">
          <div className="card-body gap-3">
            <h2 className="card-title">Where it is</h2>
            <ul className="steps steps-vertical">
              <li className="step step-primary">Paid</li>
              <li className={`step ${order.status !== "Paid" ? "step-primary" : ""}`}>Picking</li>
              <li className={`step ${order.status === "Dispatched" ? "step-primary" : ""}`}>Dispatched</li>
            </ul>
            <div className="divider my-0" />
            <div className="text-sm">
              <div>{order.customer}</div>
              <div className="opacity-70">Placed {order.placed}</div>
            </div>
            <button className="btn btn-primary btn-sm">Print picking slip</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 5. Customers ─────────────────────────────────────────────────────────────

export function Customers() {
  return (
    <div className="flex flex-col gap-4">
      <div className="breadcrumbs text-sm">
        <ul>
          <li>Shop admin</li>
          <li>Customers</li>
        </ul>
      </div>
      <div className="overflow-x-auto rounded-box border border-base-300">
        <table className="table table-zebra table-sm">
          <thead>
            <tr>
              <th>Account</th>
              <th>Name</th>
              <th>Town</th>
              <th className="text-right">Orders</th>
              <th className="text-right">Spent</th>
              <th>Trade</th>
            </tr>
          </thead>
          <tbody>
            {CUSTOMERS.map((c) => (
              <tr key={c.id}>
                <td className="font-mono">{c.id}</td>
                <td>{c.name}</td>
                <td>{c.town}</td>
                <td className="text-right tabular-nums">{c.orders}</td>
                <td className="text-right tabular-nums">{money(c.spentPence)}</td>
                <td>{c.trade ? <span className="badge badge-secondary">Trade</span> : null}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── 6. Stock take ────────────────────────────────────────────────────────────

export function StockTake() {
  const [counts, setCounts] = React.useState<Record<string, string>>({});
  const [busy, setBusy] = React.useState(false);
  const entered = Object.values(counts).filter((v) => v !== "").length;
  return (
    <div className="flex flex-col gap-4">
      <div className="breadcrumbs text-sm">
        <ul>
          <li>Shop admin</li>
          <li>Stock take</li>
        </ul>
      </div>

      <div className="alert">
        <span>
          Count the shelf, type the number. Leave it blank if you have not counted it — blank is not zero.
        </span>
      </div>

      <progress className="progress progress-primary w-full" value={entered} max={PRODUCTS.length} />
      <span className="text-sm opacity-70">
        {entered} of {PRODUCTS.length} counted
      </span>

      <div className="overflow-x-auto rounded-box border border-base-300">
        <table className="table table-sm table-pin-rows">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Product</th>
              <th className="text-right">On the system</th>
              <th className="text-right">Counted</th>
            </tr>
          </thead>
          <tbody>
            {PRODUCTS.slice(0, 12).map((p) => (
              <tr key={p.sku}>
                <td className="font-mono">{p.sku}</td>
                <td className="max-w-[22rem] truncate" title={p.name}>
                  {p.name}
                </td>
                <td className="text-right">
                  <span className={stockBadge(p.stock)}>{stockLabel(p.stock)}</span>
                </td>
                <td className="text-right">
                  <input
                    className="input input-bordered input-sm w-24 text-right tabular-nums"
                    inputMode="numeric"
                    aria-label={`Counted stock for ${p.name}`}
                    value={counts[p.sku] ?? ""}
                    onChange={(e) => setCounts({ ...counts, [p.sku]: e.target.value })}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2">
        <span className="flex-1" />
        <button
          className="btn btn-primary btn-sm"
          disabled={busy || entered === 0}
          onClick={() => {
            setBusy(true);
            window.setTimeout(() => setBusy(false), 900);
          }}
        >
          {busy && <span className="loading loading-spinner loading-xs" />}
          Post the count
        </button>
      </div>
    </div>
  );
}

// ── 7. Settings ──────────────────────────────────────────────────────────────

export function Settings() {
  const [trade, setTrade] = React.useState(true);
  const [emails, setEmails] = React.useState(false);
  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <div className="breadcrumbs text-sm">
        <ul>
          <li>Shop admin</li>
          <li>Settings</li>
        </ul>
      </div>

      <div className="card border border-base-300 bg-base-200">
        <div className="card-body gap-4">
          <h2 className="card-title">The shop</h2>
          <label className="form-control flex flex-col gap-1">
            <span className="label-text">Shop name</span>
            <input className="input input-bordered" defaultValue="Pike &amp; Daughter Tackle" />
          </label>
          <label className="form-control flex flex-col gap-1">
            <span className="label-text">VAT number</span>
            <input className="input input-bordered font-mono" defaultValue="GB 412 7781 03" />
          </label>

          <div className="divider my-0" />

          <label className="label cursor-pointer justify-start gap-3">
            <input
              type="checkbox"
              className="toggle toggle-primary"
              checked={trade}
              onChange={(e) => setTrade(e.target.checked)}
            />
            <span className="label-text">Show trade prices to trade accounts</span>
          </label>
          <label className="label cursor-pointer justify-start gap-3">
            <input
              type="checkbox"
              className="checkbox checkbox-primary"
              checked={emails}
              onChange={(e) => setEmails(e.target.checked)}
            />
            <span className="label-text">Email me when something goes out of stock</span>
          </label>

          <div className="card-actions justify-end">
            <button className="btn btn-primary btn-sm">Save settings</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 8. Sign in ───────────────────────────────────────────────────────────────

export function SignIn({ go }: { go: Go }) {
  return (
    <div className="hero min-h-full bg-base-100">
      <div className="hero-content w-full max-w-sm flex-col">
        <h1 className="text-2xl font-bold">Pike &amp; Daughter Tackle</h1>
        <div className="card w-full border border-base-300 bg-base-200">
          <form
            className="card-body gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              go({ name: "products" });
            }}
          >
            <label className="form-control flex flex-col gap-1">
              <span className="label-text">Email</span>
              <input className="input input-bordered" type="email" defaultValue="gordon@pikeanddaughter.co.uk" />
            </label>
            <label className="form-control flex flex-col gap-1">
              <span className="label-text">Password</span>
              <input className="input input-bordered" type="password" defaultValue="hunter2hunter2" />
            </label>
            <label className="label cursor-pointer justify-start gap-3">
              <input type="checkbox" className="checkbox checkbox-sm" defaultChecked />
              <span className="label-text">Keep me signed in on this machine</span>
            </label>
            <button className="btn btn-primary" type="submit">
              Sign in
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
