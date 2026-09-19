import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Badge,
  Card,
  CardBody,
  EmptyState,
  Heading,
  Text,
  Timeline,
  TimelineEnd,
  TimelineItem,
  TimelineMiddle,
  TimelineStart,
} from "@wizeworks/silicaui-react";
import { EVENTS, SHIPMENTS, STATUS_TONE, formatUsd } from "../../../data/shipments";

/**
 * Timeline ships colourless — two props, `orientation` and `box`, and a dot
 * hardcoded to `--color-base-content`. For a changelog that is right. For a
 * shipment history it is not: `Held by customs` has to be findable at a glance
 * among four ordinary rows, and the dot is the only thing on the rail.
 *
 * So the tone is composed on, which is inside the sanctioned toolbox — the
 * component’s own `.timeline-dot` class plus a Tailwind background utility. No
 * bespoke CSS, no hex, and it follows the theme because `bg-warning` resolves to
 * the same token a `Badge` would use (docs/personas, act 9).
 */
/**
 * `text-<role>` + `bg-current`, not `bg-<role>`.
 *
 * A `bg-` utility paints the role's FILL form, which is tuned to sit behind text
 * and measured **1.78:1** for `warning` against a light page — the amber dot was
 * nearly invisible in light while reading 11.45 in dark. The dot is a 12px
 * graphic doing the same job as text, so it wants the same ink, and
 * `text-<role>` carries that after issue 026. `bg-current` paints it.
 */
const DOT: Record<string, string> = {
  neutral: "text-base-content bg-current",
  info: "text-info bg-current",
  success: "text-success bg-current",
  warning: "text-warning bg-current",
  error: "text-error bg-current",
};

export default async function ShipmentDetailPage({
  params,
}: PageProps<"/shipments/[ref]">) {
  const { ref } = await params;
  const s = SHIPMENTS.find((x) => x.ref === decodeURIComponent(ref));
  if (!s) notFound();
  const events = EVENTS[s.ref] ?? [];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5">
      <Link href="/shipments" className="link text-sm">
        ← All shipments
      </Link>

      {/* The consignee IS the heading — this is where `Müller & Söhne` has to
          survive the type ramp, not only a table cell. */}
      <div className="flex flex-col gap-2">
        <Heading level={1}>{s.consignee}</Heading>
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-sm">{s.ref}</span>
          <Badge color={STATUS_TONE[s.status]} size="sm">
            {s.status}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardBody className="gap-1">
            <Text size="sm">Route</Text>
            <p className="text-lg font-semibold">
              {s.origin} → {s.destination}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="gap-1">
            <Text size="sm">Declared value</Text>
            <p className="text-lg font-semibold tabular-nums">
              {formatUsd(s.valueCents)}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="gap-1">
            <Text size="sm">Container</Text>
            {/* Absence says so. A dash here would read as a container number
                nobody typed; `Not assigned yet` is a different fact from an
                empty cell, and the operator acts differently on each. */}
            {s.containerNo ? (
              <p className="text-lg font-semibold tabular-nums">{s.containerNo}</p>
            ) : (
              <p className="text-lg font-semibold">Not assigned yet</p>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="flex flex-col gap-3">
        <Heading level={2}>History</Heading>
        {events.length ? (
          /* `.timeline > li` is a `1fr auto 1fr` grid, so the rail centres in
             whatever width it is given and the date column grows with it — at
             full page width the date ends up 400px from the event it dates.
             Capping the width keeps the two together. One utility class, which
             is the sanctioned way to do it. */
          <Timeline className="max-w-2xl">
            {events.map((e) => (
              <TimelineItem key={e.at + e.what}>
                <TimelineStart className="tabular-nums">{e.at}</TimelineStart>
                <TimelineMiddle>
                  <span className={`timeline-dot ${DOT[e.tone]}`} />
                </TimelineMiddle>
                <TimelineEnd box>
                  <p className="font-medium">{e.what}</p>
                  {e.where ? <Text size="sm">{e.where}</Text> : null}
                </TimelineEnd>
              </TimelineItem>
            ))}
          </Timeline>
        ) : (
          /* Absence, said out loud. An empty rail would read as "nothing has
             happened to this shipment", which is a different fact from "nobody
             has filed anything against it yet". */
          <EmptyState
            title="No events filed yet"
            description="Nothing has been recorded against this reference. That is not the same as nothing having happened — check the paper file."
          />
        )}
      </div>
    </div>
  );
}
