import { APP_HOSTNAME, SERVER_PORT } from "@/common/util";
import dns from "dns";

const OVERLAY_HOSTS = ["localhost", "127.0.0.1", "[::1]", APP_HOSTNAME];

/**
 * Whether the URL is an overlay: a preview loaded from disk through
 * `local-resource:`, or a page of the overlay server.
 */
export function isOverlayURL(url: string): boolean {
  try {
    const { protocol, hostname, port } = new URL(url);
    if (protocol === "local-resource:") return true;
    return (
      (protocol === "http:" || protocol === "https:") &&
      port === String(SERVER_PORT) &&
      OVERLAY_HOSTS.includes(hostname)
    );
  } catch {
    return false;
  }
}

export async function checkInternetConnection() {
  return new Promise<boolean>((res) => {
    dns.lookup("google.com", { family: 4, hints: 0 }, (err, address) => {
      if (err && !address) {
        res(false);
      } else {
        res(true);
      }
    });
  });
}
