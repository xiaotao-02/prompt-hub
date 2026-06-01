/** Renders panel SVG icon constants (currentColor stroke) via innerHTML. */
export function IconHtml({ html }: { html: string }) {
  return <span className="panel-icon" dangerouslySetInnerHTML={{ __html: html }} />;
}
