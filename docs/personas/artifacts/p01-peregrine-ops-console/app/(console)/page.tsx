import { Badge, Card, CardBody, Heading, Text } from "@wizeworks/silicaui-react";
import { SHIPMENTS, STATUS_TONE, formatUsd } from "../data/shipments";

const OPEN = SHIPMENTS.filter(
  (s) => s.status === "Customs hold" || s.status === "Awaiting pickup",
);

export default function OverviewPage() {
  const atRisk = SHIPMENTS.filter((s) => s.status === "Customs hold");
  const inTransit = SHIPMENTS.filter((s) => s.status === "In transit");

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      {/* The 68-character heading. No wrapper, no label above it — the heading
          carries itself (root CLAUDE.md RULE #2). */}
      <Heading level={1} className="text-balance">
        Live shipments awaiting customs clearance or consignee confirmation
      </Heading>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardBody className="gap-1">
            <Text size="sm">Held at customs</Text>
            <p className="text-3xl font-semibold tabular-nums">{atRisk.length}</p>
            <Text size="sm">
              {formatUsd(atRisk.reduce((n, s) => n + s.valueCents, 0))} declared
            </Text>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="gap-1">
            <Text size="sm">In transit</Text>
            <p className="text-3xl font-semibold tabular-nums">{inTransit.length}</p>
            <Text size="sm">
              {formatUsd(inTransit.reduce((n, s) => n + s.valueCents, 0))} declared
            </Text>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="gap-1">
            <Text size="sm">Live total</Text>
            <p className="text-3xl font-semibold tabular-nums">{SHIPMENTS.length}</p>
            <Text size="sm">Tashkent · Riga · Rotterdam</Text>
          </CardBody>
        </Card>
      </div>

      <section className="flex flex-col gap-3">
        <Heading level={2}>
          Needs a decision today
        </Heading>
        <ul className="flex flex-col gap-2">
          {OPEN.map((s) => (
            <li
              key={s.ref}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-box border border-base-300 p-3"
            >
              <span className="font-mono text-sm">{s.ref}</span>
              <Badge color={STATUS_TONE[s.status]} size="sm">
                {s.status}
              </Badge>
              <span className="min-w-0 flex-1 truncate">{s.consignee}</span>
              <span className="tabular-nums">{formatUsd(s.valueCents)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
