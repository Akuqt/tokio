import { APP_HOSTNAME, SERVER_PORT } from "@/common/util";
import { describe, expect, it } from "vitest";
import { isOverlayURL } from "./network";

describe("isOverlayURL", () => {
  it("matches previews loaded from disk", () => {
    expect(
      isOverlayURL(
        "local-resource:///C:/Users/me/.tokio/overlays/a/index.html",
      ),
    ).toBe(true);
  });

  it("matches pages of the overlay server", () => {
    for (const host of ["localhost", "127.0.0.1", "[::1]", APP_HOSTNAME]) {
      expect(isOverlayURL(`http://${host}:${SERVER_PORT}/a/`)).toBe(true);
    }
  });

  it("doesn't match the app or other servers", () => {
    expect(isOverlayURL("file:///C:/app/out/renderer/index.html")).toBe(false);
    expect(isOverlayURL("http://localhost:5173/")).toBe(false);
    expect(isOverlayURL(`http://example.com:${SERVER_PORT}/`)).toBe(false);
    expect(isOverlayURL("not a url")).toBe(false);
  });
});
