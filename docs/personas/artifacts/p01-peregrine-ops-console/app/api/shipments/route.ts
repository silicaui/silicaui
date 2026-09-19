import { NextResponse } from "next/server";
import { SHIPMENTS } from "../../data/shipments";

const PORTS = ["Rotterdam", "Riga", "Tashkent"];

/**
 * The list the console reads. A real request rather than an import, so the
 * loading state on the table is a state the app actually enters — a skeleton
 * that only appears behind a `setTimeout` in a demo is not a loading state, it
 * is a picture of one.
 */
export async function GET() {
  // Tashkent → the office's own rack. Slow enough to see, honest about it.
  await new Promise((r) => setTimeout(r, 550));
  return NextResponse.json(SHIPMENTS);
}

/**
 * Booking a shipment. The validation lives HERE and not in the form, which is
 * the point: the reference series is shared across six operators and two of them
 * book at once, so "is this reference taken" is a question only the server can
 * answer. A client-side check would pass and the booking would still collide.
 *
 * Returns field-keyed errors so the dialog can put each message against the
 * control it belongs to, rather than one sentence covering three causes.
 */
export async function POST(request: Request) {
  const body = (await request.json()) as {
    ref?: string;
    consignee?: string;
    destination?: string;
  };
  await new Promise((r) => setTimeout(r, 450));

  const fields: Record<string, string> = {};
  const ref = (body.ref ?? "").trim();
  const consignee = (body.consignee ?? "").trim();
  const destination = (body.destination ?? "").trim();

  if (!ref) fields.ref = "A reference is required.";
  else if (!/^PFR-\d{4}-\d{4}$/.test(ref))
    fields.ref = "References look like PFR-2026-0431 — four digits, a dash, four digits.";
  else if (SHIPMENTS.some((s) => s.ref === ref))
    fields.ref = `${ref} is already booked, to ${SHIPMENTS.find((s) => s.ref === ref)!.consignee}.`;

  if (!consignee) fields.consignee = "A consignee is required.";
  if (!destination) fields.destination = "Choose a destination port.";
  else if (!PORTS.includes(destination)) fields.destination = "Peregrine does not call at that port.";

  if (Object.keys(fields).length) {
    const count = Object.keys(fields).length;
    return NextResponse.json(
      {
        message:
          count === 1
            ? "The shipment was not booked — one field needs fixing."
            : `The shipment was not booked — ${count} fields need fixing.`,
        fields,
      },
      { status: 422 },
    );
  }

  return NextResponse.json({ ref }, { status: 201 });
}
