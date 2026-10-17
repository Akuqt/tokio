import { describe, expect, it } from "vitest";
import { withPreviewBackground } from "./preview";

const page = "<!doctype html><html><body>Overlay</body></html>";

describe("withPreviewBackground", () => {
  it("adds an opaque background after the overlay's page", async () => {
    const res = await withPreviewBackground(
      new Response(page, {
        headers: { "content-type": "text/html", "content-length": "48" },
      }),
      "C:/overlays/a/index.html",
    );

    const html = await res.text();
    expect(html.startsWith(page)).toBe(true);
    expect(html).toContain("<style>html{background-color:#121212!important}");
    expect(res.headers.get("content-type")).toBe("text/html");
    expect(res.headers.get("content-length")).toBeNull();
  });

  it("leaves other files and failed reads alone", async () => {
    const script = new Response("console.log(1)");
    expect(await withPreviewBackground(script, "/overlays/a/app.js")).toBe(
      script,
    );

    const missing = new Response(null, { status: 404 });
    expect(await withPreviewBackground(missing, "/overlays/a/index.html")).toBe(
      missing,
    );
  });
});
