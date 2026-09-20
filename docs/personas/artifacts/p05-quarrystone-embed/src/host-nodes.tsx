/**
 * Quarrystone's three host-owned nodes.
 *
 * These are OURS. The compliance certificate and the plant statistics come out
 * of our API, they are legally our responsibility, and a customer moving,
 * retyping, restyling or deleting one is not a bug report — it is a regulatory
 * problem. The enquiry form is ours too, but an author may move it: where the
 * lead form sits on the page is their call, what it does is not.
 *
 * **Built on silicaui components and Tailwind utilities, with no inline
 * `style`.** The first cut of this file painted every block with `style={{…}}`
 * objects. It looked right in the editor and in `vite dev`, and then the
 * published page — served with a real Content-Security-Policy and no
 * `'unsafe-inline'` — dropped every one of them and rendered the certificate as
 * naked text. Found by act 9; see the run log.
 */
import type { ReactNode } from "react";
import { Button, Card, CardBody, CardTitle, Input, Textarea } from "@wizeworks/silicaui-react";

export interface Plant {
  id: string;
  name: string;
  certificate: string;
  certificateExpires: string;
  issuedBy: string;
  tonnage: string;
  fleet: number;
  lastInspection: string;
  contact: string;
  adminUrl: string;
  /** Free-text note from an inspection. Empty for a plant with nothing to note,
   *  which is different from a field we do not have. */
  remark?: string;
}

/** The one real plant, exactly as the persona file writes it. */
export const HOGANAS: Plant = {
  id: "plant-hoganas-angelholmsvagen",
  name: "Höganäs Kross & Grus AB — Ängelholmsvägen anläggning",
  certificate: "SE-AGG-2024-11847",
  certificateExpires: "2026-12-31",
  issuedBy: "RISE Research Institutes of Sweden",
  tonnage: "412 880 t/år",
  fleet: 14,
  lastInspection: "2026-03-17",
  contact: "+46 42 33 91 06",
  adminUrl: "https://admin.quarrystone.se/plants/plant-hoganas-angelholmsvagen/compliance",
};

/**
 * A plant belonging to a DIFFERENT Quarrystone account.
 *
 * It is here on purpose. An isolation check that has nothing to reach for
 * proves nothing, so there has to be a real second customer's record in the
 * same process, with a real certificate number, for a page to try to name.
 */
export const BROARYD: Plant = {
  id: "plant-broaryd-sandtag",
  name: "Broaryd Sand & Grus AB — Sandtaget",
  certificate: "SE-AGG-2025-20913",
  certificateExpires: "2027-06-30",
  issuedBy: "RISE Research Institutes of Sweden",
  tonnage: "96 400 t/år",
  fleet: 4,
  lastInspection: "2026-05-02",
  contact: "+46 371 55 20 18",
  adminUrl: "https://admin.quarrystone.se/plants/plant-broaryd-sandtag/compliance",
};

/** Which account owns which plant. Authorization is OURS - the builder has no
 *  idea who is signed in and should never be told. */
export const ACCOUNT_PLANTS: Record<string, readonly string[]> = {
  "acct-hoganas": [HOGANAS.id],
  "acct-broaryd": [BROARYD.id],
};

/** Who is signed in. One value, set by our own auth, read by our own resolver. */
export let signedInAccount = "acct-hoganas";
export function setSignedInAccount(id: string) {
  signedInAccount = id;
}

const ALL_PLANTS: Record<string, Plant> = { [HOGANAS.id]: HOGANAS, [BROARYD.id]: BROARYD };

/**
 * The plants THIS account may see. Every render path goes through this, so a
 * page naming a plant the signed-in account does not own resolves to nothing -
 * the same answer as a plant that was deleted, which is correct: from here, it
 * does not exist.
 */
export const PLANTS: Record<string, Plant> = new Proxy(ALL_PLANTS, {
  get(target, key: string) {
    const owned = ACCOUNT_PLANTS[signedInAccount] ?? [];
    return owned.includes(key) ? target[key] : undefined;
  },
  has(target, key: string) {
    const owned = ACCOUNT_PLANTS[signedInAccount] ?? [];
    return owned.includes(key) && key in target;
  },
  ownKeys() {
    return [...(ACCOUNT_PLANTS[signedInAccount] ?? [])];
  },
  getOwnPropertyDescriptor(target, key: string) {
    const owned = ACCOUNT_PLANTS[signedInAccount] ?? [];
    return owned.includes(key) ? { configurable: true, enumerable: true, value: target[key] } : undefined;
  },
});

/** One labelled fact. Solid ink on both halves — a label is read, so RULE #3
 *  keeps it off a fade. */
const Row = ({ k, v }: { k: string; v: ReactNode }) => (
  <div className="flex justify-between gap-4 text-base text-base-content">
    <span className="font-semibold">{k}</span>
    <span>{v}</span>
  </div>
);

/**
 * When our API has nothing behind the reference, SAY SO.
 *
 * A fabricated value is worse than a gap and a silent blank is worse than
 * either — an author who sees an empty box assumes they deleted something and
 * starts undoing work that was never lost.
 */
function Unresolved({ what, ref_ }: { what: string; ref_: string }) {
  return (
    <Card className="border border-dashed border-warning bg-base-100" data-quarrystone-unresolved={ref_}>
      <CardBody className="gap-2 text-base text-base-content">
        <CardTitle className="text-base">{what} — not available</CardTitle>
        <p>
          Nothing in Quarrystone answers to <code className="font-mono">{ref_}</code>. This block is not empty because
          anything was deleted; it is empty because the record behind it is gone or was never created.
        </p>
        <p>Ask an administrator to re-link the plant, then reload this page.</p>
      </CardBody>
    </Card>
  );
}

export function ComplianceCert({ plantId }: { plantId?: string }) {
  const plant = plantId ? PLANTS[plantId] : undefined;
  if (!plant) return <Unresolved what="Compliance certificate" ref_={plantId ?? "(no plant on this block)"} />;
  const expires = new Date(`${plant.certificateExpires}T23:59:00`);
  return (
    <Card className="border border-base-300 bg-base-100" data-quarrystone-host-node="compliance-cert">
      <CardBody className="gap-1.5">
        <CardTitle className="text-lg text-base-content">Certifierad bergmaterialproduktion</CardTitle>
        <Row k="Certificate" v={<code className="font-mono">{plant.certificate}</code>} />
        <Row
          k="Expires"
          v={expires.toLocaleDateString("sv-SE", { year: "numeric", month: "long", day: "numeric" })}
        />
        <Row k="Issued by" v={plant.issuedBy} />
      </CardBody>
    </Card>
  );
}

export function PlantStats({ plantId }: { plantId?: string }) {
  const plant = plantId ? PLANTS[plantId] : undefined;
  if (!plant) return <Unresolved what="Plant statistics" ref_={plantId ?? "(no plant on this block)"} />;
  return (
    <Card className="border border-base-300 bg-base-100" data-quarrystone-host-node="plant-stats">
      <CardBody className="gap-1.5">
        <CardTitle className="text-lg text-base-content">Anläggningen i siffror</CardTitle>
        <Row k="Tonnage" v={plant.tonnage} />
        <Row k="Fleet" v={`${plant.fleet} fordon`} />
        <Row k="Last inspection" v={new Date(plant.lastInspection).toLocaleDateString("sv-SE")} />
      </CardBody>
    </Card>
  );
}

export function PriceEnquiryForm({ plantId }: { plantId?: string }) {
  const plant = plantId ? PLANTS[plantId] : undefined;
  return (
    <Card className="border border-base-300 bg-base-100" data-quarrystone-host-node="price-enquiry-form">
      <CardBody className="gap-3">
        <CardTitle className="text-lg text-base-content">Begär prisuppgift</CardTitle>
        <form className="flex flex-col gap-3" action="https://api.quarrystone.se/leads" method="post">
          <input type="hidden" name="plant" value={plant?.id ?? ""} />
          <label className="flex flex-col gap-1 text-base text-base-content">
            <span className="font-semibold">E-post</span>
            <Input name="email" type="email" required placeholder="namn@foretag.se" />
          </label>
          <label className="flex flex-col gap-1 text-base text-base-content">
            <span className="font-semibold">Material och mängd</span>
            <Textarea name="enquiry" rows={3} />
          </label>
          <Button type="submit" color="primary" className="self-start">
            Skicka förfrågan
          </Button>
        </form>
        {plant && (
          <span className="text-base text-base-content">Vi svarar på {plant.contact} inom en arbetsdag.</span>
        )}
      </CardBody>
    </Card>
  );
}
