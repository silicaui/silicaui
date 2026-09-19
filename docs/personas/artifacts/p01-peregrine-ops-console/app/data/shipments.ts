/** The status vocabulary the operators use. Tone drives the chip colour. */
export type ShipmentStatus =
  | "In transit"
  | "Customs hold"
  | "Delivered"
  | "Awaiting pickup"
  | "Cancelled";

export const STATUS_TONE = {
  "In transit": "info",
  "Customs hold": "warning",
  Delivered: "success",
  "Awaiting pickup": "neutral",
  Cancelled: "error",
} as const;

export interface Shipment {
  ref: string;
  consignee: string;
  origin: string;
  destination: string;
  status: ShipmentStatus;
  /** Minor units. Money is never a float. */
  valueCents: number;
  etaIso: string;
  /** Deliberately absent on some rows — see the detail screen. */
  containerNo?: string;
}

export const SHIPMENTS: Shipment[] = [
  { ref: "PFR-2026-0417", consignee: "Oltin Vodiy Tekstil MChJ", origin: "Tashkent", destination: "Rotterdam", status: "In transit", valueCents: 4_821_000, etaIso: "2026-10-02", containerNo: "MSKU 442817-3" },
  { ref: "PFR-2026-0418", consignee: "Baltijas Koks SIA", origin: "Riga", destination: "Tashkent", status: "Customs hold", valueCents: 794_050, etaIso: "2026-09-24", containerNo: "TCLU 908115-0" },
  { ref: "PFR-2026-0419", consignee: "Müller & Söhne Spedition GmbH", origin: "Rotterdam", destination: "Riga", status: "Delivered", valueCents: 11_260_000, etaIso: "2026-09-15", containerNo: "HLXU 771402-6" },
  { ref: "PFR-2026-0420", consignee: "Samarqand Qurilish Materiallari Ishlab Chiqarish Korxonasi", origin: "Tashkent", destination: "Riga", status: "Awaiting pickup", valueCents: 201_575, etaIso: "2026-10-11" },
  { ref: "PFR-2026-0421", consignee: "Northbound Cold Chain Ltd", origin: "Riga", destination: "Rotterdam", status: "In transit", valueCents: 6_330_000, etaIso: "2026-09-29", containerNo: "MSCU 330914-8" },
  { ref: "PFR-2026-0422", consignee: "Zarafshon Metall Konstruksiya MChJ", origin: "Tashkent", destination: "Rotterdam", status: "Customs hold", valueCents: 1_887_425, etaIso: "2026-10-06", containerNo: "OOLU 118253-2" },
  { ref: "PFR-2026-0423", consignee: "De Vries Agrarisch Transport BV", origin: "Rotterdam", destination: "Tashkent", status: "In transit", valueCents: 38_940_000, etaIso: "2026-10-18", containerNo: "CMAU 664720-9" },
  { ref: "PFR-2026-0424", consignee: "Liepājas Jūras Krava AS", origin: "Riga", destination: "Rotterdam", status: "Delivered", valueCents: 2_744_800, etaIso: "2026-09-09", containerNo: "SEGU 205661-4" },
  { ref: "PFR-2026-0425", consignee: "Farg'ona Yog'-Moy Kombinati", origin: "Tashkent", destination: "Riga", status: "Cancelled", valueCents: 916_300, etaIso: "2026-09-21" },
  { ref: "PFR-2026-0426", consignee: "Hanseatic Bulk Handling GmbH", origin: "Rotterdam", destination: "Riga", status: "Awaiting pickup", valueCents: 5_402_050, etaIso: "2026-10-14", containerNo: "TGHU 887301-5" },
  { ref: "PFR-2026-0427", consignee: "Buxoro Gilam Fabrikasi", origin: "Tashkent", destination: "Rotterdam", status: "In transit", valueCents: 7_118_900, etaIso: "2026-10-08", containerNo: "MSKU 559013-1" },
  { ref: "PFR-2026-0428", consignee: "Rīgas Ķīmijas Rūpnīca SIA", origin: "Riga", destination: "Tashkent", status: "Customs hold", valueCents: 13_207_500, etaIso: "2026-10-01" },
  { ref: "PFR-2026-0429", consignee: "Van Oord Projectlading BV", origin: "Rotterdam", destination: "Tashkent", status: "Delivered", valueCents: 88_615_000, etaIso: "2026-09-11", containerNo: "APZU 471938-7" },
  { ref: "PFR-2026-0430", consignee: "Navoiy Kon-Metallurgiya Kombinati", origin: "Tashkent", destination: "Riga", status: "In transit", valueCents: 24_509_950, etaIso: "2026-10-22", containerNo: "FCIU 102847-3" },
];

/**
 * Money, formatted once. Cents in, a string a person can compare down a column
 * out — `Intl` handles the grouping and the trailing `.50` that a naive
 * `toFixed` on a float would eventually round away.
 */
export function formatUsd(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

/**
 * What actually happened to a shipment, in order. Real operations vocabulary —
 * these are the words on Peregrine's own paperwork, not generic "step 1/2/3".
 */
export interface ShipmentEvent {
  at: string;
  what: string;
  where?: string;
  /** Drives the dot colour. `warning` is the one she scans for. */
  tone: "neutral" | "info" | "success" | "warning" | "error";
}

export const EVENTS: Record<string, ShipmentEvent[]> = {
  "PFR-2026-0418": [
    { at: "2026-09-02", what: "Booking confirmed", where: "Riga", tone: "neutral" },
    { at: "2026-09-05", what: "Container stuffed and sealed", where: "Riga", tone: "neutral" },
    { at: "2026-09-08", what: "Departed", where: "Riga", tone: "info" },
    { at: "2026-09-19", what: "Held by customs — invoice value queried", where: "Tashkent", tone: "warning" },
  ],
  "PFR-2026-0419": [
    { at: "2026-08-24", what: "Booking confirmed", where: "Rotterdam", tone: "neutral" },
    { at: "2026-08-29", what: "Departed", where: "Rotterdam", tone: "info" },
    { at: "2026-09-12", what: "Arrived", where: "Riga", tone: "info" },
    { at: "2026-09-15", what: "Delivered and signed for", where: "Riga", tone: "success" },
  ],
  "PFR-2026-0420": [
    { at: "2026-09-16", what: "Booking confirmed", where: "Tashkent", tone: "neutral" },
    { at: "2026-09-18", what: "Awaiting pickup at the yard", where: "Tashkent", tone: "neutral" },
  ],
  "PFR-2026-0425": [
    { at: "2026-08-30", what: "Booking confirmed", where: "Tashkent", tone: "neutral" },
    { at: "2026-09-04", what: "Cancelled by the consignee", where: "Tashkent", tone: "error" },
  ],
};
