export function JsonLd({ data }: { data: Record<string, unknown> }) {
  // Unicode-escape HTML-special chars to prevent </script> injection in JSON-LD
  const safeJson = JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJson }}
    />
  )
}
