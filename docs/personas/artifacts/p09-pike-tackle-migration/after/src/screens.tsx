/**
 * The eight screens, migrated to Silica UI.
 *
 * The rule the migration followed: **swap the classes, leave the code alone.**
 * Every `useState`, every handler, every bit of filtering and paging logic below
 * is byte-for-byte what it was on daisyUI. What changed is the markup, and only
 * where a class had to become a component.
 *
 * Where something is NOT a one-for-one swap it says so at the call site, because
 * those are the rows in the migration ledger that cost real time — and they are
 * the ones a class-mapping table would have to warn about.
 */
import * as React from "react";
import {
  Alert,
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogClose,
  Badge,
  Breadcrumb,
  Button,
  Card,
  CardActions,
  CardBody,
  CardTitle,
  Checkbox,
  Divider,
  Field,
  FieldControl,
  FieldLabel,
  Hero,
  Input,
  Loading,
  Pagination,
  Progress,
  Stat,
  StatDesc,
  StatTitle,
  StatValue,
  Stats,
  Step,
  Steps,
  Table,
  Tabs,
  TabsList,
  TabsTab,
  Textarea,
  Toggle,
} from "@wizeworks/silicaui-react";
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

/**
 * The colour a stock figure gets. Never the only signal — the words differ too.
 *
 * MIGRATION NOTE. This was four class strings; it is four prop values. The
 * `badge-ghost` that meant "not counted" became `variant="outline"`, because
 * ghost on a badge is a fill and outline is the shape that reads as "this is not
 * a state, it is an absence".
 */
type StockTone = {
  color: "success" | "warning" | "error" | "neutral";
  variant: "solid" | "outline";
};

function stockTone(stock: number | null): StockTone {
  if (stock === null) return { color: "neutral", variant: "outline" };
  if (stock === 0) return { color: "error", variant: "solid" };
  if (stock < 5) return { color: "warning", variant: "solid" };
  return { color: "success", variant: "solid" };
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
      <Breadcrumb>
        <ul>
          <li>Shop admin</li>
          <li>Products</li>
        </ul>
      </Breadcrumb>

      <Stats className="border border-base-300">
        <Stat>
          <StatTitle>Products</StatTitle>
          <StatValue className="text-2xl">{PRODUCTS.length}</StatValue>
        </Stat>
        <Stat>
          <StatTitle>Out of stock</StatTitle>
          <StatValue className="text-2xl">{PRODUCTS.filter((p) => p.stock === 0).length}</StatValue>
          <StatDesc>counted, and none left</StatDesc>
        </Stat>
        <Stat>
          <StatTitle>Never counted</StatTitle>
          <StatValue className="text-2xl">{PRODUCTS.filter((p) => p.stock === null).length}</StatValue>
          <StatDesc>not the same as none</StatDesc>
        </Stat>
      </Stats>

      <div className="flex flex-wrap items-end gap-2">
        <Field className="w-60">
          <FieldLabel>Search</FieldLabel>
          {/* NOT a drop-in, and the type checker is what said so. `FieldControl`
              renders a native input, where `size` is the HTML attribute and takes
              a NUMBER — so `size="sm"` is a type error rather than a small field.
              Silica's own sized control goes in through `render`, which is the
              documented way to put any non-default control in a Field. */}
          <FieldControl
            render={<Input size="sm" />}
            placeholder="SKU or product"
            value={q}
            onChange={(e) => {
              setQ(e.currentTarget.value);
              setPage(0);
            }}
          />
        </Field>
        <Field>
          <FieldLabel>Category</FieldLabel>
          {/* A NATIVE select, deliberately. Silica has a listbox `Select` with
              Base UI behind it and this screen does not need one: a six-option
              category filter on a shop admin used one-handed on an iPad is better
              served by the platform's own picker. The `select` class is Silica's,
              so it is themed either way. */}
          <FieldControl
            render={
              <select
                className="select select-sm"
                value={cat}
                onChange={(e) => {
                  setCat(e.currentTarget.value);
                  setPage(0);
                }}
              >
                <option>All</option>
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            }
          />
        </Field>
        <span className="flex-1" />
        <Button color="primary" size="sm" onClick={() => go({ name: "product", sku: "PD-4471" })}>
          New product
        </Button>
      </div>

      <Table zebra size="sm" wrapperClassName="rounded-box border border-base-300">
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
          {shown.map((p) => {
            const tone = stockTone(p.stock);
            return (
              <tr key={p.sku}>
                <td className="font-mono">{p.sku}</td>
                <td className="max-w-[24rem] truncate" title={p.name}>
                  {p.name}
                </td>
                <td className="text-right tabular-nums">{money(p.pricePence)}</td>
                <td className="text-right">
                  <Badge color={tone.color} variant={tone.variant}>
                    {stockLabel(p.stock)}
                  </Badge>
                </td>
                <td className="text-right">
                  <Button variant="ghost" size="xs" onClick={() => go({ name: "product", sku: p.sku })}>
                    Edit
                  </Button>
                </td>
              </tr>
            );
          })}
          {shown.length === 0 && (
            <tr>
              <td colSpan={5}>
                <Alert color="warning">
                  Nothing matches that. Clear the search or pick another category.
                </Alert>
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      <div className="flex items-center gap-3">
        <span className="text-sm">
          {rows.length} of {PRODUCTS.length}
        </span>
        <span className="flex-1" />
        {/* NOT a drop-in, and the one place this screen got better rather than
            equal. daisyUI's `join` is a visual grouping, and the three buttons
            inside it were hand-rolled paging. `Pagination` is the component:
            numbered pages, ellipses, prev and next, and the aria that goes with
            them. It is 1-based where this state is 0-based, which is the only
            edit the swap needed. */}
        <Pagination page={page + 1} count={pages} size="sm" onValueChange={(next) => setPage(next - 1)} />
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

  // `Number("-")` is NaN, and `NaN < 0` is false -- so typing a minus sign put
  // NaN into the draft and the guard below never fired. Carried over faithfully
  // from the daisyUI app, which has the same bug, and found by the standing
  // check that says "set stock to a negative number". Fixed in both trees so the
  // diff stays a migration and not a bug fix wearing one.
  const badStock = draft.stock !== null && (Number.isNaN(draft.stock) || draft.stock < 0);

  return (
    <div className="flex flex-col gap-4">
      <Breadcrumb>
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
      </Breadcrumb>

      <Card className="border border-base-300 bg-base-200">
        <CardBody className="gap-4">
          <CardTitle>{draft.name}</CardTitle>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>Product name</FieldLabel>
              <FieldControl
                render={<Input />}
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.currentTarget.value })}
              />
            </Field>
            <Field>
              <FieldLabel>SKU</FieldLabel>
              <FieldControl render={<Input className="font-mono" />} value={draft.sku} readOnly />
            </Field>
            <Field>
              <FieldLabel>Price, in pounds</FieldLabel>
              <FieldControl
                render={<Input className="tabular-nums" />}
                inputMode="decimal"
                value={(draft.pricePence / 100).toFixed(2)}
                onChange={(e) =>
                  setDraft({ ...draft, pricePence: Math.round(Number(e.currentTarget.value || 0) * 100) })
                }
              />
            </Field>
            {/* The validation state rides on the SAME field, which is the one
                thing daisyUI has no answer for: there it was a separate
                `alert alert-error` block further down the form, unconnected to
                the input that caused it. `status` + `statusMessage` wires the
                message to the control with the aria to match. */}
            <Field status={badStock ? "error" : undefined} statusMessage={badStock ? "Stock cannot be negative. It is either a number from zero up, or not counted." : undefined}>
              <FieldLabel>Stock</FieldLabel>
              <FieldControl
                render={<Input className="tabular-nums" />}
                inputMode="numeric"
                value={draft.stock === null ? "" : String(draft.stock)}
                placeholder="not counted"
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    stock: e.currentTarget.value === "" ? null : Number(e.currentTarget.value),
                  })
                }
              />
            </Field>
            <Field>
              <FieldLabel>Category</FieldLabel>
              <FieldControl
                render={
                  <select
                    className="select"
                    value={draft.category}
                    onChange={(e) => setDraft({ ...draft, category: e.currentTarget.value as Product["category"] })}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                }
              />
            </Field>
            <Field>
              <FieldLabel>Supplier</FieldLabel>
              <FieldControl
                render={<Input />}
                value={draft.supplier}
                onChange={(e) => setDraft({ ...draft, supplier: e.currentTarget.value })}
              />
            </Field>
          </div>

          <Field>
            <FieldLabel>Shelf note</FieldLabel>
            <FieldControl render={<Textarea rows={3} />} placeholder="Anything the counter needs to know" />
          </Field>

          <CardActions className="items-center">
            {saved && <Badge color="success">Saved</Badge>}
            <span className="flex-1" />
            <Button variant="ghost" size="sm" onClick={() => setConfirming(true)}>
              Delete
            </Button>
            <Button color="primary" size="sm" disabled={badStock} onClick={() => setSaved(true)}>
              Save changes
            </Button>
          </CardActions>
        </CardBody>
      </Card>

      {/* NOT a drop-in, and the biggest single improvement in the migration.
          daisyUI's `modal modal-open` is a `<dialog>` with a class on it: no
          focus trap, no scroll lock, no escape handling, nothing returns focus
          to the button that opened it. `AlertDialog` is Base UI, which does all
          four. The markup is the same shape; what arrives is behaviour that was
          simply not there before. */}
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete {draft.sku}?</AlertDialogTitle>
          <AlertDialogDescription>
            {draft.name} will be removed from the shop. Orders that already contain it keep it.
          </AlertDialogDescription>
          {/* `AlertDialogClose` takes its button as a CHILD, not a `render`
              prop -- the opposite of `FieldControl` two screens up. Two
              components, two spellings of "wrap my element", and the type
              checker is the only thing that says which is which. */}
          <div className="flex justify-end gap-2">
            <AlertDialogClose>
              <Button size="sm">Keep it</Button>
            </AlertDialogClose>
            <AlertDialogClose>
              <Button color="error" size="sm">
                Delete it
              </Button>
            </AlertDialogClose>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── 3. Orders ────────────────────────────────────────────────────────────────

const ORDER_TONE: Record<string, "info" | "warning" | "success" | "neutral"> = {
  Paid: "info",
  Picking: "warning",
  Dispatched: "success",
  Refunded: "neutral",
};

export function Orders({ go }: { go: Go }) {
  const [tab, setTab] = React.useState<"All" | "Picking" | "Dispatched">("All");
  const rows = ORDERS.filter((o) => tab === "All" || o.status === tab);
  return (
    <div className="flex flex-col gap-4">
      <Breadcrumb>
        <ul>
          <li>Shop admin</li>
          <li>Orders</li>
        </ul>
      </Breadcrumb>

      {/* NOT a drop-in. daisyUI's tabs are `role="tablist"` plus a `tab-active`
          class the app has to keep in sync itself — arrow keys do nothing,
          because nothing is listening. Silica's are Base UI: a roving tabindex,
          arrow-key movement, and a moving indicator. The state moved from a
          className to `value`/`onValueChange`, which is the same state in a
          different place. */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          {(["All", "Picking", "Dispatched"] as const).map((t) => (
            <TabsTab key={t} value={t}>
              {t}
            </TabsTab>
          ))}
        </TabsList>
      </Tabs>

      <Table size="sm" wrapperClassName="rounded-box border border-base-300">
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
                <Badge color={ORDER_TONE[o.status]} variant={o.status === "Refunded" ? "outline" : "solid"}>
                  {o.status}
                </Badge>
              </td>
              <td className="text-right tabular-nums">{money(o.totalPence)}</td>
              <td className="text-right">
                <Button variant="ghost" size="xs" onClick={() => go({ name: "order", id: o.id })}>
                  Open
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

// ── 4. One order ─────────────────────────────────────────────────────────────

export function OrderDetail({ id, go }: { id: string; go: Go }) {
  const order = ORDERS.find((o) => o.id === id) ?? ORDERS[0]!;
  return (
    <div className="flex flex-col gap-4">
      <Breadcrumb>
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
      </Breadcrumb>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card className="border border-base-300 bg-base-200">
          <CardBody>
            <CardTitle>What is in it</CardTitle>
            <Table size="sm">
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
            </Table>
            <Divider className="my-1" />
            <div className="flex items-baseline justify-between">
              <span className="font-semibold">Total</span>
              <span className="text-xl font-bold tabular-nums">{money(order.totalPence)}</span>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-base-300 bg-base-200">
          <CardBody className="gap-3">
            <CardTitle>Where it is</CardTitle>
            {/* daisyUI has `steps-vertical` and Silica had NOTHING -- not a
                prop, not a class, and the CSS module opened with "a horizontal
                progress tracker". This is the component act 7 was looking for,
                and it turned up in act 3. Added rather than worked around
                (issues/100), spelled `vertical` to match `Stats`. */}
            <Steps vertical>
              <Step color="primary">Paid</Step>
              <Step color={order.status !== "Paid" ? "primary" : undefined}>Picking</Step>
              <Step color={order.status === "Dispatched" ? "primary" : undefined}>Dispatched</Step>
            </Steps>
            <Divider className="my-0" />
            <div className="text-sm">
              <div>{order.customer}</div>
              <div>Placed {order.placed}</div>
            </div>
            <Button color="primary" size="sm">
              Print picking slip
            </Button>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

// ── 5. Customers ─────────────────────────────────────────────────────────────

export function Customers() {
  return (
    <div className="flex flex-col gap-4">
      <Breadcrumb>
        <ul>
          <li>Shop admin</li>
          <li>Customers</li>
        </ul>
      </Breadcrumb>
      <Table zebra size="sm" wrapperClassName="rounded-box border border-base-300">
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
              <td>{c.trade ? <Badge color="secondary">Trade</Badge> : null}</td>
            </tr>
          ))}
        </tbody>
      </Table>
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
      <Breadcrumb>
        <ul>
          <li>Shop admin</li>
          <li>Stock take</li>
        </ul>
      </Breadcrumb>

      <Alert>
        Count the shelf, type the number. Leave it blank if you have not counted it — blank is not zero.
      </Alert>

      {/* daisyUI's was a native `<progress>` with a class. Silica's is a div with
          the progressbar role and real value bounds, and it can print its own
          label — so the "12 of 30 counted" line below it is now the component's
          job rather than a separate span somebody has to keep in step. */}
      <Progress
        color="primary"
        value={entered}
        max={PRODUCTS.length}
        showValue
        label="Counted"
        formatValue={(v, max) => `${v} of ${max}`}
      />

      <Table size="sm" wrapperClassName="rounded-box border border-base-300">
        <thead>
          <tr>
            <th>SKU</th>
            <th>Product</th>
            <th className="text-right">On the system</th>
            <th className="text-right">Counted</th>
          </tr>
        </thead>
        <tbody>
          {PRODUCTS.slice(0, 12).map((p) => {
            const tone = stockTone(p.stock);
            return (
              <tr key={p.sku}>
                <td className="font-mono">{p.sku}</td>
                <td className="max-w-[22rem] truncate" title={p.name}>
                  {p.name}
                </td>
                <td className="text-right">
                  <Badge color={tone.color} variant={tone.variant}>
                    {stockLabel(p.stock)}
                  </Badge>
                </td>
                <td className="text-right">
                  <Input
                    size="sm"
                    className="w-24 text-right tabular-nums"
                    inputMode="numeric"
                    aria-label={`Counted stock for ${p.name}`}
                    value={counts[p.sku] ?? ""}
                    onChange={(e) => setCounts({ ...counts, [p.sku]: e.currentTarget.value })}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>

      <div className="flex items-center gap-2">
        <span className="flex-1" />
        <Button
          color="primary"
          size="sm"
          disabled={busy || entered === 0}
          onClick={() => {
            setBusy(true);
            window.setTimeout(() => setBusy(false), 900);
          }}
        >
          {busy && <Loading size="xs" />}
          Post the count
        </Button>
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
      <Breadcrumb>
        <ul>
          <li>Shop admin</li>
          <li>Settings</li>
        </ul>
      </Breadcrumb>

      <Card className="border border-base-300 bg-base-200">
        <CardBody className="gap-4">
          <CardTitle>The shop</CardTitle>
          <Field>
            <FieldLabel>Shop name</FieldLabel>
            <FieldControl render={<Input />} defaultValue="Pike &amp; Daughter Tackle" />
          </Field>
          <Field>
            <FieldLabel>VAT number</FieldLabel>
            <FieldControl render={<Input className="font-mono" />} defaultValue="GB 412 7781 03" />
          </Field>

          <Divider className="my-0" />

          {/* Three lines became one, twice. daisyUI needed a `<label>` with
              `cursor-pointer justify-start gap-3`, the input, and a `label-text`
              span; Silica's Toggle and Checkbox take the caption as children and
              wrap themselves in the label. */}
          <Toggle color="primary" checked={trade} onChange={(e) => setTrade(e.currentTarget.checked)}>
            Show trade prices to trade accounts
          </Toggle>
          <Checkbox color="primary" checked={emails} onChange={(e) => setEmails(e.currentTarget.checked)}>
            Email me when something goes out of stock
          </Checkbox>

          <CardActions className="justify-end">
            <Button color="primary" size="sm">
              Save settings
            </Button>
          </CardActions>
        </CardBody>
      </Card>
    </div>
  );
}

// ── 8. Sign in ───────────────────────────────────────────────────────────────

export function SignIn({ go }: { go: Go }) {
  return (
    <Hero className="min-h-full bg-base-100">
      <div className="flex w-full max-w-sm flex-col gap-4">
        <h1 className="text-2xl font-bold">Pike &amp; Daughter Tackle</h1>
        <Card className="w-full border border-base-300 bg-base-200">
          {/* daisyUI put `card-body` straight on the `<form>`. `CardBody` is a
              `<div>` with no `render`, so the form wraps the card body instead.
              Same markup depth, one more element, no behaviour lost. */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              go({ name: "products" });
            }}
          >
          <CardBody className="gap-3">
            <Field>
              <FieldLabel>Email</FieldLabel>
              <FieldControl render={<Input type="email" />} defaultValue="gordon@pikeanddaughter.co.uk" />
            </Field>
            <Field>
              <FieldLabel>Password</FieldLabel>
              <FieldControl render={<Input type="password" />} defaultValue="hunter2hunter2" />
            </Field>
            <Checkbox size="sm" defaultChecked>
              Keep me signed in on this machine
            </Checkbox>
            <Button color="primary" type="submit">
              Sign in
            </Button>
          </CardBody>
          </form>
        </Card>
      </div>
    </Hero>
  );
}
