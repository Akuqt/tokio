import { OverlayMetadata, TestOverlay } from "@/common/schemas";
import { CustomGift, TOKIO_EVENTS } from "@/common/types";
import { defaultStoreData, generateTikTokEventSample } from "@/common/util";
import { JSONManagerService } from "@/services/json";
import { ServerService } from "@/services/server";
import { YAMLManagerService } from "@/services/yaml";
import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  MockInstance,
  vi,
} from "vitest";
import { processHTML } from "./common";
import { OverlayService } from "./index";

vi.mock("./common", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./common")>();
  return { ...actual, processHTML: vi.fn(actual.processHTML) };
});

const SETUP = '<script id="tokio-setup"></script>';

const info = (name: string, config = false) =>
  `name: ${name}\nversion: 1.0.0\nconfig: ${config}\n`;

const config = (value: string) =>
  [
    "sections:",
    "  - { name: Main, id: main }",
    "fields:",
    "  - name: Title",
    "    id: title",
    "    section: main",
    "    type: input",
    `    attributes: { mode: text, value: ${value}, default: Hello }`,
  ].join("\n");

const gifts: CustomGift[] = [{ value: 1, label: "Rose", img: "", coins: 1 }];

describe("OverlayService", () => {
  let root: string;
  let folder: string;
  let service: OverlayService;
  let stored: (OverlayMetadata & { id: string })[];
  let testOverlays: TestOverlay[];
  let rebuilt: boolean;
  let mount: MockInstance<ServerService["mount"]>;
  let unmount: MockInstance<ServerService["unmount"]>;
  let sendToClient: MockInstance<ServerService["sendToClient"]>;

  const store = {
    wasRebuilt: () => rebuilt,
    getSettings: () => ({
      ...defaultStoreData.settings,
      overlays: structuredClone(stored),
      testOverlays: structuredClone(testOverlays),
    }),
    addOverlayInfo: async (o: OverlayMetadata & { id: string }) => {
      stored.push(o);
    },
    removeOverlayInfo: async (id: string) => {
      stored = stored.filter((o) => o.id !== id);
    },
    addTestOverlay: async (o: TestOverlay) => {
      testOverlays.push(o);
    },
    removeTestOverlay: async (id: string) => {
      testOverlays = testOverlays.filter((o) => o.id !== id);
    },
  };

  const overlay = async (dir: string, files: Record<string, string>) => {
    await mkdir(dir, { recursive: true });
    for (const [name, content] of Object.entries(files)) {
      await writeFile(join(dir, name), content);
    }
  };

  const configurable = (dir: string) =>
    overlay(dir, {
      "info.yaml": info("Title", true),
      "config.yaml": config("Saved"),
      "index.html": `<body>${SETUP}</body>`,
    });

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), "tokio-test-"));
    folder = join(root, "overlays");
    await mkdir(folder);
    stored = [];
    testOverlays = [];
    rebuilt = false;
    // Not started, it only keeps the routes.
    const server = new ServerService(0);
    mount = vi.spyOn(server, "mount");
    unmount = vi.spyOn(server, "unmount");
    sendToClient = vi.spyOn(server, "sendToClient");
    service = new OverlayService();
    service.initialize(
      { folder, giftsFile: join(root, "gifts.json") },
      {
        yaml: new YAMLManagerService(),
        json: new JSONManagerService(),
        server,
        store,
      },
    );
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  describe("load", () => {
    it("serves the overlays that load and forgets the rest", async () => {
      await configurable(join(folder, "title"));
      await overlay(join(folder, "broken"), { "info.yaml": info("Broken") });
      stored = [
        { id: "title", name: "Title", version: "1.0.0", config: true },
        { id: "broken", name: "Broken", version: "1.0.0", config: false },
      ];

      await service.load(gifts);

      expect(mount).toHaveBeenCalledExactlyOnceWith(
        "title",
        join(folder, "title"),
        false,
      );
      expect(stored.map((o) => o.id)).toEqual(["title"]);
      expect(service.getOverlays()).toMatchObject([
        { id: "title", path: join(folder, "title", "index.html") },
      ]);
      expect(
        await readFile(join(folder, "title", "index.html"), "utf-8"),
      ).toContain(`window.__OVERLAY_CONFIG__ = {"title":"Saved"}`);
      expect(await service.getGifts()).toEqual(gifts);
    });

    it("writes gifts that changed after load into the loaded overlays", async () => {
      await configurable(join(folder, "title"));
      stored = [{ id: "title", name: "Title", version: "1.0.0", config: true }];
      await service.load(gifts);
      const lion = { value: 2, label: "Lion", img: "", coins: 29999 };
      vi.mocked(processHTML).mockClear();

      await service.refreshGifts([...gifts, lion]);

      expect(processHTML).toHaveBeenCalledOnce();
      expect(vi.mocked(processHTML).mock.calls[0][5]).toEqual([...gifts, lion]);
      expect(await service.getGifts()).toEqual([...gifts, lion]);
    });

    it("leaves the overlays alone when the gifts didn't change", async () => {
      await configurable(join(folder, "title"));
      stored = [{ id: "title", name: "Title", version: "1.0.0", config: true }];
      await service.load(gifts);
      vi.mocked(processHTML).mockClear();

      await service.refreshGifts(structuredClone(gifts));

      expect(processHTML).not.toHaveBeenCalled();
    });

    it("doesn't serve an overlay whose HTML can't be written", async () => {
      await configurable(join(folder, "title"));
      stored = [{ id: "title", name: "Title", version: "1.0.0", config: true }];
      vi.mocked(processHTML).mockResolvedValueOnce({ success: false });

      await service.load(gifts);

      expect(mount).not.toHaveBeenCalled();
      expect(stored).toEqual([]);
      expect(service.getOverlays()).toEqual([]);
    });

    it("recovers the installed overlays when the store was rebuilt", async () => {
      await overlay(join(folder, "clock"), {
        "info.yaml": info("Clock"),
        "index.html": "<h1>clock</h1>",
      });
      rebuilt = true;

      await service.load(gifts);

      expect(stored).toMatchObject([{ id: "clock", external: true }]);
      expect(mount).toHaveBeenCalledWith("clock", join(folder, "clock"), false);
    });
  });

  describe("import", () => {
    it("copies the overlay with its defaults and serves it", async () => {
      const source = join(root, "source");
      await configurable(source);

      expect(await service.import(source, gifts)).toEqual({ success: true });

      const [id] = await readdir(folder);
      expect(stored).toMatchObject([{ id, name: "Title", external: true }]);
      expect(mount).toHaveBeenCalledWith(id, join(folder, id), true);
      const html = await readFile(join(folder, id, "index.html"), "utf-8");
      expect(html).toContain(`window.__OVERLAY_CONFIG__ = {"title":"Hello"}`);
      expect(html).toContain(`window.__OVERLAY_ID__ = "${id}"`);
      // The source is left as it was.
      expect(await readFile(join(source, "index.html"), "utf-8")).toBe(
        `<body>${SETUP}</body>`,
      );
    });

    it("rejects a folder that isn't an overlay", async () => {
      const source = join(root, "source");
      await overlay(source, { "index.html": "<p></p>" });

      expect(await service.import(source, gifts)).toEqual({ success: false });
      expect(await readdir(folder)).toEqual([]);
      expect(stored).toEqual([]);
    });

    it("removes the copy when its HTML can't be written", async () => {
      const source = join(root, "source");
      await configurable(source);
      vi.mocked(processHTML).mockResolvedValueOnce({ success: false });

      expect(await service.import(source, gifts)).toEqual({ success: false });
      expect(await readdir(folder)).toEqual([]);
      expect(mount).not.toHaveBeenCalled();
    });
  });

  describe("remove", () => {
    it("deletes an imported overlay and stops serving it", async () => {
      const source = join(root, "source");
      await configurable(source);
      await service.import(source, gifts);
      const [id] = await readdir(folder);

      expect(await service.remove(id)).toEqual({ success: true });

      expect(await readdir(folder)).toEqual([]);
      expect(stored).toEqual([]);
      expect(unmount).toHaveBeenCalledWith(id);
      expect(service.getOverlays()).toEqual([]);
    });

    it("refuses an id that isn't stored", async () => {
      await configurable(join(folder, "title"));

      expect(await service.remove("..")).toMatchObject({ success: false });
      expect(await service.remove("title")).toMatchObject({ success: false });

      expect(await readdir(root)).toContain("overlays");
      expect(await readdir(folder)).toEqual(["title"]);
      expect(unmount).not.toHaveBeenCalled();
    });

    it("keeps official overlays", async () => {
      await configurable(join(folder, "title"));
      stored = [{ id: "title", name: "Title", version: "1.0.0", config: true }];

      expect(await service.remove("title")).toMatchObject({ success: false });

      expect(await readdir(folder)).toEqual(["title"]);
      expect(stored).toHaveLength(1);
    });
  });

  it("saves a config into the overlay's HTML and config file", async () => {
    await configurable(join(folder, "title"));
    const res = await service.getConfig("title");
    const field = res.data!.fields[0];
    if (field.type !== "input") throw new Error("Expected an input field");
    field.attributes.value = "Changed";

    expect(await service.saveConfig("title", res.data!, gifts)).toEqual({
      success: true,
      data: { title: "Changed" },
    });
    expect(
      await readFile(join(folder, "title", "index.html"), "utf-8"),
    ).toContain(`window.__OVERLAY_CONFIG__ = {"title":"Changed"}`);
    expect((await service.getConfig("title")).data).toEqual(res.data);
  });

  it("fails to get the config of a missing overlay", async () => {
    expect(await service.getConfig("missing")).toEqual({
      success: false,
      data: undefined,
    });
  });

  it("sends data to one overlay", () => {
    const payload = generateTikTokEventSample(TOKIO_EVENTS.FOLLOW);

    service.send("a", payload);

    expect(sendToClient).toHaveBeenCalledExactlyOnceWith("a", payload);
  });

  it("samples every live event for tests", () => {
    const types = service.getTestPayloads().map((p) => p.type);

    expect(types).toContain(TOKIO_EVENTS.CHAT);
    expect(types).not.toContain(TOKIO_EVENTS.CONNECTED);
    expect(types).not.toContain(TOKIO_EVENTS.DISCONNECTED);
    expect(types).not.toContain(TOKIO_EVENTS.MUSIC_PROCCESS_ENDED);
  });

  describe("test overlays", () => {
    it("creates a named id and removes it", async () => {
      const created = await service.createTestOverlay("  Gift goal  ");

      expect(created.success).toBe(true);
      expect(created.data).toEqual([
        { id: expect.any(String), name: "Gift goal" },
      ]);
      expect(service.getTestOverlays()).toEqual(created.data);

      const removed = await service.removeTestOverlay(created.data![0].id);

      expect(removed).toEqual({ success: true, data: [] });
    });

    it("rejects an empty name", async () => {
      expect(await service.createTestOverlay("   ")).toEqual({
        success: false,
      });
      expect(service.getTestOverlays()).toEqual([]);
    });

    it("sends every test payload to the id", () => {
      sendToClient.mockReturnValue(true);

      expect(service.sendTestEvents("dev")).toEqual({ success: true });

      const sent = sendToClient.mock.calls;
      expect(sent.every(([id]) => id === "dev")).toBe(true);
      expect(sent.map(([, p]) => p.type)).toEqual(
        service.getTestPayloads().map((p) => p.type),
      );
    });

    it("fails when no overlay is connected with the id", () => {
      expect(service.sendTestEvents("dev")).toEqual({ success: false });
    });
  });
});
