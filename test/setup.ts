import { beforeEach, vi } from "vitest";

// The real module only works inside Electron.
vi.mock("electron", () => ({
  safeStorage: {
    isEncryptionAvailable: () => true,
    encryptString: (text: string) => Buffer.from(text, "utf-8"),
    decryptString: (data: Buffer) => data.toString("utf-8"),
  },
  dialog: {},
  BrowserWindow: class {},
  WebContentsView: class {},
}));

// Logger and the queues write to the console, keep the test output readable.
beforeEach(() => {
  for (const method of ["log", "warn", "error"] as const) {
    vi.spyOn(console, method).mockImplementation(() => {});
  }
});
