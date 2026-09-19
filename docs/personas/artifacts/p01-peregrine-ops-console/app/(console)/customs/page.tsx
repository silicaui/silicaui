import { Heading, Text } from "@wizeworks/silicaui-react";

export default function CustomsPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <Heading level={1}>
        Customs
      </Heading>
      <Text>Holds, declarations and clearance dates.</Text>
    </div>
  );
}
