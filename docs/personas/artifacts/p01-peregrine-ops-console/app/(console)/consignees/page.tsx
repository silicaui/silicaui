import { Heading, Text } from "@wizeworks/silicaui-react";

export default function ConsigneesPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <Heading level={1}>
        Consignees
      </Heading>
      <Text>Who receives what, and where.</Text>
    </div>
  );
}
