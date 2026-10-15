import Logger from "@/logger";
import { exec } from "@vscode/sudo-prompt";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { URLManagerService } from "./index";

// Never touch the real hosts file or ask for admin rights.
const hosts = vi.hoisted(() => ({ path: "" }));
vi.mock("@/config", async (importOriginal) => {
  const { default: config } = await importOriginal<typeof import("@/config")>();
  return {
    default: {
      ...config,
      CMD: {
        ...config.CMD,
        get HOST() {
          return [hosts.path];
        },
      },
    },
  };
});
vi.mock("@vscode/sudo-prompt", () => ({ exec: vi.fn() }));

const elevated = (error?: Error) =>
  vi.mocked(exec).mockImplementation((_cmd, _options, callback) => {
    callback?.(error);
  });

describe("URLManagerService", () => {
  let dir: string;
  let service: URLManagerService;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "tokio-test-"));
    hosts.path = join(dir, "hosts");
    service = new URLManagerService();
    vi.mocked(exec).mockReset();
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("builds overlay URLs on the app hostname", () => {
    expect(service.getURL("clock")).toBe(
      "https://tokio-app.local:37891/clock/",
    );

    service.setPort(4000);

    expect(service.getURL("clock")).toBe("https://tokio-app.local:4000/clock/");
  });

  describe("installAppFQDN", () => {
    it("does nothing when the hostname is already there", async () => {
      await writeFile(hosts.path, "127.0.0.1 tokio-app.local\n");

      expect(await service.installAppFQDN()).toBe(true);
      expect(exec).not.toHaveBeenCalled();
    });

    it("appends the hostname block with admin rights", async () => {
      await writeFile(hosts.path, "127.0.0.1 localhost\n");
      elevated();

      expect(await service.installAppFQDN()).toBe(true);

      expect(exec).toHaveBeenCalledOnce();
      expect(exec).toHaveBeenCalledWith(
        [
          `echo.>> ${hosts.path}`,
          `echo ## Tokio App Hostname - Start ##>> ${hosts.path}`,
          `echo 127.0.0.1 tokio-app.local>> ${hosts.path}`,
          `echo ## Tokio App Hostname - End ##>> ${hosts.path}`,
        ].join("\n"),
        { name: "Tokio" },
        expect.any(Function),
      );
    });

    it("fails when the admin prompt is refused", async () => {
      await writeFile(hosts.path, "");
      elevated(new Error("User did not grant permission."));
      const error = vi.spyOn(Logger, "error");

      expect(await service.installAppFQDN()).toBe(false);
      expect(error).toHaveBeenCalledWith(
        expect.stringContaining("User did not grant permission."),
        undefined,
        expect.any(Error),
      );
    });

    it("fails without prompting when the hosts file can't be read", async () => {
      expect(await service.installAppFQDN()).toBe(false);
      expect(exec).not.toHaveBeenCalled();
    });
  });
});
