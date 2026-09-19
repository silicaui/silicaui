import { Heading } from "@wizeworks/silicaui-react";
import { ShipmentsTable } from "./shipments-table";

export default function ShipmentsPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <Heading level={1}>Shipments</Heading>
      <ShipmentsTable />
    </div>
  );
}
