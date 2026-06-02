export function JsonLd({ data }: { data: Record<string, unknown>[] }) {
  if (!data.length) return null;
  return (
    <>
      {data.map((block, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}
    </>
  );
}
