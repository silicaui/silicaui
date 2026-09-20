/**
 * The publish half of `renderHostNode`.
 *
 * `toHtml` projects a host node to an empty mount point —
 * `<div data-sui-host="quarrystone.compliance-cert" data-sui-host-props="…">` —
 * and says plainly that filling it is ours:
 *
 *   > A host node is a live-widget MOUNT POINT … a host mounts its real
 *   > component into this hook (client or SSR), the same posture as
 *   > `rawHtml`/behavior markers, so the projection stays framework-free.
 *
 * We fill it at PUBLISH time, not in the browser. A compliance certificate that
 * needs JavaScript to appear is a compliance certificate that does not appear.
 *
 * This imports the SAME components the builder canvas renders, so there is one
 * definition of what our blocks look like and no second copy to drift.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { ComplianceCert, PlantStats, PriceEnquiryForm } from "./host-nodes";
import { COMPLIANCE_CERT, PLANT_STATS, PRICE_ENQUIRY } from "./quarrystone-host";

export function renderHostNodeToStaticHtml(component: string, props: Record<string, unknown>): string {
  const plantId = typeof props.plantId === "string" ? props.plantId : undefined;
  switch (component) {
    case COMPLIANCE_CERT:
      return renderToStaticMarkup(<ComplianceCert plantId={plantId} />);
    case PLANT_STATS:
      return renderToStaticMarkup(<PlantStats plantId={plantId} />);
    case PRICE_ENQUIRY:
      return renderToStaticMarkup(<PriceEnquiryForm plantId={plantId} />);
    default:
      // The same answer the editor gives, for the same reason: a block we no
      // longer ship must say so rather than leaving a hole on a live page.
      return renderToStaticMarkup(
        <div style={{ border: "1px dashed #b91c1c", borderRadius: 8, padding: 12, color: "#7f1d1d", fontSize: 14 }}>
          Quarrystone does not know a block called <code>{component}</code>.
        </div>,
      );
  }
}
