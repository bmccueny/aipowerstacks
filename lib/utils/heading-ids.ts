/**
 * Inject id attributes into <h2> and <h3> tags so the TOC can link to them.
 * Runs after sanitize-html, before rendering.
 */
export function injectHeadingIds(html: string): string {
  return html.replace(/<(h[23])([^>]*)>(.*?)<\/\1>/gi, (_match, tag, attrs, text) => {
    const plain = text.replace(/<[^>]+>/g, '').trim()
    const id = plain
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
    return `<${tag}${attrs} id="${id}">${text}</${tag}>`
  })
}
