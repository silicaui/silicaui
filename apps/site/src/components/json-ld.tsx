/**
 * Renders one or more schema.org objects as a JSON-LD <script>. A Server
 * Component, so the structured data is baked into the static HTML at build
 * time — exactly where a non-JS crawler or answer engine reads it.
 *
 * Pass a single schema object or an array; arrays emit one script per node.
 */
export function JsonLd({ data }: { data: object | object[] }) {
  const nodes = Array.isArray(data) ? data : [data];
  return (
    <>
      {nodes.map((node, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(node) }}
        />
      ))}
    </>
  );
}
