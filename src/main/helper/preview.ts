// --background-primary in src/ui/styles/tokens.css, what previews sit on
const PREVIEW_BACKGROUND = "#121212";

/**
 * Gives an overlay page loaded as a preview (through `local-resource:`) the
 * app's background. Overlays are transparent so they can sit on the stream,
 * and Chromium only draws ClearType text on an opaque background, so their
 * text looked rough next to the app's. The files and what the overlay server
 * sends stay as they are. Other files pass through.
 */
export async function withPreviewBackground(
  res: Response,
  path: string,
): Promise<Response> {
  if (!res.ok || !/\.html?$/i.test(path)) return res;

  // After everything else, so it wins over the overlay's own styles. Adding
  // it before the doctype would switch the page to quirks mode.
  const html = `${await res.text()}<style>html{background-color:${PREVIEW_BACKGROUND}!important}</style>`;
  const headers = new Headers(res.headers);
  headers.delete("content-length");
  return new Response(html, { status: res.status, headers });
}
