/**
 * Quarrystone's BuilderHost — the whole of our domain, in one object.
 *
 * Written from builder-contract.md §5 and nothing else. Everything the doc did
 * not say is filed in docs/personas/issues/, not patched over quietly here.
 */
import type { BuilderHost, HostComponentDef, InspectorTabDef, SelectableNode } from "@wizeworks/silicaui-builder/react";
import { ComplianceCert, PlantStats, PriceEnquiryForm, PLANTS, HOGANAS } from "./host-nodes";

/** `HostNode.component` values. One place, so the three lists below cannot drift. */
export const COMPLIANCE_CERT = "quarrystone.compliance-cert";
export const PLANT_STATS = "quarrystone.plant-stats";
export const PRICE_ENQUIRY = "quarrystone.price-enquiry-form";

const plantOptions = Object.values(PLANTS).map((p) => ({ value: p.id, label: p.name }));

const components: HostComponentDef[] = [
  {
    name: COMPLIANCE_CERT,
    label: "Compliance certificate",
    category: "Quarrystone",
    icon: "shield",
    hint: "The plant's live certificate. Ours, not the customer's — it cannot be edited here.",
    // PINNED: inserts host-locked. The author gets no unlock, and only we can
    // clear it. This is the whole reason we are evaluating this builder.
    pinned: true,
    props: [{ name: "plantId", label: "Plant", type: "select", options: plantOptions, default: HOGANAS.id }],
    defaultProps: { plantId: HOGANAS.id },
  },
  {
    name: PLANT_STATS,
    label: "Plant statistics",
    category: "Quarrystone",
    icon: "chart",
    hint: "Tonnage, fleet and last inspection, read live from Quarrystone.",
    pinned: true,
    props: [{ name: "plantId", label: "Plant", type: "select", options: plantOptions, default: HOGANAS.id }],
    defaultProps: { plantId: HOGANAS.id },
  },
  {
    name: PRICE_ENQUIRY,
    label: "Price enquiry form",
    category: "Quarrystone",
    icon: "mail",
    // NOT pinned. Where the lead form sits on the page is the author's call;
    // what it does is not, and `renderHostNode` is the only thing that decides
    // that — there is no markup here for them to reach.
    hint: "Our lead form. You can move it anywhere on the page; its fields are ours.",
    props: [{ name: "plantId", label: "Plant", type: "select", options: plantOptions, default: HOGANAS.id }],
    defaultProps: { plantId: HOGANAS.id },
  },
];

/** The Compliance tab — node-scoped, so it appears on the certificate block and
 *  nowhere else. An underline tab, not a pill: a pill is a mode switch. */
function complianceTab(node: SelectableNode | undefined): InspectorTabDef[] {
  if (!node || node.kind !== "host" || node.component !== COMPLIANCE_CERT) return [];
  const plantId = (node.props as { plantId?: string } | undefined)?.plantId;
  const plant = plantId ? PLANTS[plantId] : undefined;
  return [
    {
      id: "quarrystone-compliance",
      label: "Compliance",
      icon: "shield",
      order: 5, // Design is 0, Settings is 10 — this lands between them.
      scope: "node",
      render: () => (
        <div className="flex flex-col gap-3 p-3.5 text-sm text-base-content">
          {plant ? (
            <>
              <div className="flex flex-col gap-1">
                <span className="font-semibold">{plant.name}</span>
                <span>
                  Certificate <code>{plant.certificate}</code>
                </span>
                <span>
                  Expires{" "}
                  {new Date(`${plant.certificateExpires}T23:59:00`).toLocaleDateString("sv-SE", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
                <span>Issued by {plant.issuedBy}</span>
              </div>
              <p>
                This block is maintained by Quarrystone and cannot be edited on the page. Change it in the admin and it
                updates everywhere it appears.
              </p>
              <a
                className="link link-primary"
                href={plant.adminUrl}
                target="_blank"
                rel="noreferrer"
              >
                Open in Quarrystone admin
              </a>
            </>
          ) : (
            <p>
              This block does not name a plant, so there is nothing to show. Pick one on the Settings tab.
            </p>
          )}
        </div>
      ),
    },
  ];
}

/** The blocks whose appearance is ours, not the author's. */
const STYLE_LOCKED = new Set([COMPLIANCE_CERT, PLANT_STATS]);

export const quarrystoneHost: BuilderHost = {
  hostComponents: () => components,

  /**
   * The class policy, and the only reason our compliance block is safe.
   *
   * A host lock stops it being moved or deleted, and the spec is explicit that
   * it does NOT stop it being restyled — locking is structural, not editorial.
   * That is the right line for a page builder and the wrong outcome for us: an
   * author who can put `hidden` on a certificate we are legally answerable for
   * has not broken a rule, they have created a regulatory problem.
   *
   * The spec's own answer is that a host wanting a read-only region "withholds
   * inspector controls". Until `validateClass` received the NODE, there was no
   * way to: we could ban `hidden` everywhere or nowhere. See issues/081.
   */
  validateClass: (cls, node) => {
    const n = node as { kind?: string; component?: string } | undefined;
    if (n?.kind === "host" && n.component && STYLE_LOCKED.has(n.component)) {
      return {
        ok: false,
        reason: "Quarrystone owns how this block looks — it has to appear the same on every plant page.",
      };
    }
    return { ok: true };
  },

  renderHostNode: (node) => {
    const plantId = (node.props as { plantId?: string } | undefined)?.plantId;
    switch (node.component) {
      case COMPLIANCE_CERT:
        return <ComplianceCert plantId={plantId} />;
      case PLANT_STATS:
        return <PlantStats plantId={plantId} />;
      case PRICE_ENQUIRY:
        return <PriceEnquiryForm plantId={plantId} />;
      default:
        // A kind the document uses and this map does not know. Say it out loud
        // rather than rendering nothing — one of the standing checks is exactly
        // this, and a silent blank is how an author concludes they broke it.
        return (
          <div style={{ border: "1px dashed #b91c1c", borderRadius: 8, padding: 12, color: "#7f1d1d", fontSize: 14 }}>
            Quarrystone does not know a block called <code>{node.component}</code>. It was probably removed from the
            product; ask an administrator.
          </div>
        );
    }
  },

  inspectorTabs: complianceTab,

  // The data the binding picker offers. Flat, computed once, exactly as §5 says.
  dataSources: () => [
    { key: "plant.name", label: "Plant name", cardinality: "scalar" },
    { key: "plant.contact", label: "Contact number", cardinality: "scalar" },
    { key: "plant.tonnage", label: "Annual tonnage", cardinality: "scalar" },
    // A field that EXISTS and is empty for most plants. Kept deliberately: it is
    // the other half of the resolution contract, and the only way to tell that
    // "we have no remark" and "we have never heard of this field" are two
    // different answers is to have one of each to compare.
    { key: "plant.anmarkning", label: "Remark", cardinality: "scalar" },
  ],

  resolveBinding: (ref) => {
    const p = HOGANAS;
    if (ref === "plant.name") return { value: p.name };
    if (ref === "plant.contact") return { value: p.contact };
    if (ref === "plant.tonnage") return { value: p.tonnage };
    // KNOWN and empty. `{ value: "" }`, never `undefined` - this plant has no
    // remark, which is a real answer.
    if (ref === "plant.anmarkning") return { value: p.remark ?? "" };
    // Unknown ref: undefined, NOT an empty string. The difference is the whole
    // of the honesty contract — one means "nothing answers to this", the other
    // means "it answered, with nothing".
    return undefined;
  },
};
