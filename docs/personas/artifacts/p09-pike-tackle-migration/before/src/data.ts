/**
 * Pike & Daughter Tackle's real stock, typed as the shop writes it.
 *
 * The first four are the ones that break things and they are typed exactly as
 * they appear on the shelf labels: an apostrophe in the shop's own-brand line, a
 * 62-character product name, prices with pence, and a stock of **0** — which is
 * not the same fact as a stock that has never been counted, and must never read
 * the same on screen.
 *
 * This file is IDENTICAL in `before/` and `after/`. The migration is a change of
 * user interface, not of data, and keeping the data byte-identical is what makes
 * the diff between the two folders readable as a migration.
 */

export interface Product {
  sku: string;
  name: string;
  /** Pence, so no float ever touches money. */
  pricePence: number;
  /** `null` means NEVER COUNTED. `0` means counted, and there are none. */
  stock: number | null;
  category: Category;
  supplier: string;
}

export const CATEGORIES = ["Reels", "Rods", "Terminal tackle", "Line", "Bait", "Clothing"] as const;
export type Category = (typeof CATEGORIES)[number];

export const PRODUCTS: Product[] = [
  { sku: "PD-4471", name: "Shimano Stradic FL 2500 spinning reel", pricePence: 22999, stock: 4, category: "Reels", supplier: "Shimano UK" },
  { sku: "PD-1180", name: "Drennan Acolyte Ultra 13ft float rod — 3 piece, with spare tip", pricePence: 18450, stock: 0, category: "Rods", supplier: "Drennan" },
  { sku: "PD-0902", name: "Korda Krank size 4 barbless (pack of 10)", pricePence: 485, stock: 118, category: "Terminal tackle", supplier: "Korda" },
  { sku: "PD-3355", name: "Pike & Daughter's own 20lb fluorocarbon, 100m", pricePence: 1120, stock: 26, category: "Line", supplier: "own brand" },
  { sku: "PD-4472", name: "Shimano Baitrunner ST 6000 RB", pricePence: 15999, stock: 2, category: "Reels", supplier: "Shimano UK" },
  { sku: "PD-4473", name: "Daiwa Ninja LT 3000", pricePence: 6495, stock: 9, category: "Reels", supplier: "Daiwa" },
  { sku: "PD-4474", name: "Okuma Ceymar C-30", pricePence: 4499, stock: null, category: "Reels", supplier: "Okuma" },
  { sku: "PD-1181", name: "Drennan Vertex 12ft feeder rod", pricePence: 13999, stock: 3, category: "Rods", supplier: "Drennan" },
  { sku: "PD-1182", name: "Sonik Xtractor 9ft carp rod, 3lb test", pricePence: 5995, stock: 7, category: "Rods", supplier: "Sonik" },
  { sku: "PD-1183", name: "Greys Prodigy TXL 10ft", pricePence: 11950, stock: 0, category: "Rods", supplier: "Greys" },
  { sku: "PD-1184", name: "Shakespeare Superteam 11ft quiver", pricePence: 7250, stock: 5, category: "Rods", supplier: "Shakespeare" },
  { sku: "PD-0903", name: "Drennan Super Specialist size 8 (pack of 10)", pricePence: 425, stock: 64, category: "Terminal tackle", supplier: "Drennan" },
  { sku: "PD-0904", name: "Fox Edges Kwik Change pop-up weights", pricePence: 699, stock: 31, category: "Terminal tackle", supplier: "Fox" },
  { sku: "PD-0905", name: "Guru QM1 speed stops, small", pricePence: 349, stock: null, category: "Terminal tackle", supplier: "Guru" },
  { sku: "PD-0906", name: "Preston Innovations Dura Hollo elastic, size 11", pricePence: 1599, stock: 12, category: "Terminal tackle", supplier: "Preston" },
  { sku: "PD-0907", name: "Korum Quickstop bait bands (pack of 25)", pricePence: 299, stock: 87, category: "Terminal tackle", supplier: "Korum" },
  { sku: "PD-3356", name: "Pike & Daughter's own 15lb mono, 250m", pricePence: 899, stock: 41, category: "Line", supplier: "own brand" },
  { sku: "PD-3357", name: "Berkley Trilene XL 8lb, 300m", pricePence: 1249, stock: 18, category: "Line", supplier: "Berkley" },
  { sku: "PD-3358", name: "PowerPro Spectra braid 30lb, 135m", pricePence: 2795, stock: 0, category: "Line", supplier: "PowerPro" },
  { sku: "PD-3359", name: "Daiwa J-Braid X4 20lb, 270m", pricePence: 1899, stock: 6, category: "Line", supplier: "Daiwa" },
  { sku: "PD-2210", name: "Dynamite Baits Monster Tiger Nut boilies 15mm, 1kg", pricePence: 1450, stock: 22, category: "Bait", supplier: "Dynamite" },
  { sku: "PD-2211", name: "Mainline Cell pop-ups 15mm", pricePence: 899, stock: 14, category: "Bait", supplier: "Mainline" },
  { sku: "PD-2212", name: "Sticky Baits Krill Active 12mm, 5kg", pricePence: 5995, stock: null, category: "Bait", supplier: "Sticky" },
  { sku: "PD-2213", name: "Bait-Tech Special G Green groundbait, 1kg", pricePence: 599, stock: 48, category: "Bait", supplier: "Bait-Tech" },
  { sku: "PD-2214", name: "Frozen sardines, box of 10", pricePence: 750, stock: 3, category: "Bait", supplier: "local" },
  { sku: "PD-5540", name: "Fortis Marine jacket, size L", pricePence: 21999, stock: 1, category: "Clothing", supplier: "Fortis" },
  { sku: "PD-5541", name: "Navitas Atlas puffa gilet, size XL", pricePence: 7999, stock: 4, category: "Clothing", supplier: "Navitas" },
  { sku: "PD-5542", name: "Pike & Daughter's own beanie, one size", pricePence: 1200, stock: 33, category: "Clothing", supplier: "own brand" },
  { sku: "PD-5543", name: "Vass-Tex 700 chest waders, size 10", pricePence: 12500, stock: 0, category: "Clothing", supplier: "Vass" },
  { sku: "PD-5544", name: "Korda Kore polar fleece, size M", pricePence: 4499, stock: 8, category: "Clothing", supplier: "Korda" },
];

export interface Order {
  id: string;
  customer: string;
  placed: string;
  status: "Paid" | "Picking" | "Dispatched" | "Refunded";
  totalPence: number;
  lines: { sku: string; qty: number }[];
}

/**
 * The last two are the date test, and they are real deliveries.
 *
 * `2026-08-31` is the last day of a month and `2026-02-28` is the last day of a
 * 28-day February. Both are stored and printed as the strings the feed sends;
 * nothing here parses them into a `Date`, which is the only way a delivery dated
 * the 31st shows up as the 30th to a shop in Grimsby being read from a machine
 * eight hours west.
 */
export const ORDERS: Order[] = [
  { id: "PD-ORD-8841", customer: "R. Ainsworth", placed: "2026-09-18", status: "Picking", totalPence: 23484, lines: [{ sku: "PD-4471", qty: 1 }, { sku: "PD-0902", qty: 1 }] },
  { id: "PD-ORD-8840", customer: "Hull Angling Club", placed: "2026-09-18", status: "Paid", totalPence: 9740, lines: [{ sku: "PD-0903", qty: 4 }, { sku: "PD-3356", qty: 8 }] },
  { id: "PD-ORD-8839", customer: "M. Okonkwo", placed: "2026-09-17", status: "Dispatched", totalPence: 18450, lines: [{ sku: "PD-1180", qty: 1 }] },
  { id: "PD-ORD-8838", customer: "S. Whitlow", placed: "2026-09-17", status: "Refunded", totalPence: 2795, lines: [{ sku: "PD-3358", qty: 1 }] },
  { id: "PD-ORD-8837", customer: "Grimsby Sea Anglers", placed: "2026-09-16", status: "Dispatched", totalPence: 43998, lines: [{ sku: "PD-5540", qty: 2 }] },
  { id: "PD-ORD-8836", customer: "T. Bąk", placed: "2026-09-16", status: "Paid", totalPence: 1450, lines: [{ sku: "PD-2210", qty: 1 }] },
  { id: "PD-ORD-8835", customer: "R. Ainsworth", placed: "2026-09-15", status: "Dispatched", totalPence: 6495, lines: [{ sku: "PD-4473", qty: 1 }] },
  { id: "PD-ORD-8834", customer: "Hull Angling Club", placed: "2026-08-31", status: "Dispatched", totalPence: 1798, lines: [{ sku: "PD-3356", qty: 2 }] },
  { id: "PD-ORD-8712", customer: "S. Whitlow", placed: "2026-02-28", status: "Dispatched", totalPence: 599, lines: [{ sku: "PD-2213", qty: 1 }] },
];

export interface Customer {
  id: string;
  name: string;
  town: string;
  orders: number;
  spentPence: number;
  trade: boolean;
}

export const CUSTOMERS: Customer[] = [
  { id: "C-0117", name: "R. Ainsworth", town: "Cleethorpes", orders: 34, spentPence: 189940, trade: false },
  { id: "C-0042", name: "Hull Angling Club", town: "Hull", orders: 112, spentPence: 1244050, trade: true },
  { id: "C-0203", name: "M. Okonkwo", town: "Grimsby", orders: 7, spentPence: 41200, trade: false },
  { id: "C-0198", name: "S. Whitlow", town: "Louth", orders: 19, spentPence: 88315, trade: false },
  { id: "C-0009", name: "Grimsby Sea Anglers", town: "Grimsby", orders: 260, spentPence: 3109900, trade: true },
  { id: "C-0231", name: "T. Bąk", town: "Immingham", orders: 3, spentPence: 5240, trade: false },
];

/** Pounds and pence, as the shop writes them on a label. */
export function money(pence: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(pence / 100);
}

/**
 * What the stock column SAYS.
 *
 * `0` and `null` are different facts and the shop orders from this screen, so
 * they must never render the same. This returns the words; the colour is chosen
 * separately, because colour alone is not a distinction.
 */
export function stockLabel(stock: number | null): string {
  if (stock === null) return "not counted";
  if (stock === 0) return "none in stock";
  return String(stock);
}
