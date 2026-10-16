import { Profile } from "@/common/schemas";
import { ChatEvent, UserData } from "@/common/types";
import { defaultProfile } from "@/common/util";
import Logger from "@/logger";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TTSService } from "./index";

// Real providers spawn PowerShell or call online services.
vi.mock("./providers", async () => {
  const { TTSProvider } = await import("./common");
  class FakeTTS extends TTSProvider {
    setKey() {}
    getVoices() {
      return [{ name: "Fake", lang: "en" }];
    }
    getDefaultVoice() {
      return { name: "Fake", lang: "en" };
    }
    async generateBuffer(text: string) {
      return { success: true, buffer: Buffer.from(text) };
    }
  }
  return { TikTokTTS: FakeTTS, WindowsTTS: FakeTTS, EdgeTTS: FakeTTS };
});

type TTSSettings = Profile["tts"];

const settings = (change: (s: TTSSettings) => void = () => {}): TTSSettings => {
  const s = structuredClone(defaultProfile.tts);
  s.protection.cooldown = 0;
  s.format.template = "";
  change(s);
  return s;
};

const viewer: UserData = {
  username: "Viewer",
  handle: "viewer",
  profilePictures: [],
};

const chat = (content: string, user: UserData = viewer): ChatEvent => ({
  user,
  comment: { content, emotes: [], lang: "en" },
});

describe("TTSService", () => {
  let service: TTSService;

  beforeEach(() => {
    service = new TTSService();
  });

  // Resolves with what was sent to the speakers, if anything.
  const say = async (comment: string | ChatEvent, s = settings()) => {
    const spoken: string[] = [];
    service.talk(
      typeof comment === "string" ? chat(comment) : comment,
      s,
      (res) => spoken.push(res.data?.toString() ?? ""),
    );
    await new Promise((r) => setTimeout(r));
    return spoken;
  };

  it("starts on the Default provider and registers Edge", async () => {
    const names = service.getProviders().map((p) => p.name);

    expect(service.getActiveProvider()?.name).toBe("Default");
    expect(names).toContain("Edge");
    expect(await service.getDefaultVoice()).toEqual({
      name: "Fake",
      lang: "en",
    });
  });

  it("passes the profile's filters and queue options along", async () => {
    const s = settings((s) => {
      s.filters.pitch = 1.5;
      s.protection.queue_length = 3;
    });
    const callback = vi.fn();

    service.talk(chat("hi"), s, callback);
    await new Promise((r) => setTimeout(r));

    expect(callback).toHaveBeenCalledWith({
      data: Buffer.from("hi"),
      filters: s.filters,
      queueOptions: { gapTime: 0, maxQueueLength: 3 },
    });
  });

  describe("filters", () => {
    it("ignores empty comments", async () => {
      expect(await say("")).toEqual([]);
    });

    it("needs the trigger prefix unless the mode is any", async () => {
      const s = settings((s) => {
        s.format.trigger = { mode: "custom", value: "!tts" };
      });

      expect(await say("hello", s)).toEqual([]);
      expect(await say("!tts hello", s)).toHaveLength(1);
    });

    it("drops comments with banned words, ignoring case", async () => {
      const s = settings((s) => {
        s.protection.banned = ["Spoiler"];
      });

      expect(await say("big SPOILERS ahead", s)).toEqual([]);
      expect(await say("no secrets", s)).toHaveLength(1);
    });

    it("drops comments over the length limit", async () => {
      const s = settings((s) => {
        s.protection.comment_length = 5;
      });

      expect(await say("123456", s)).toEqual([]);
      expect(await say("12345", s)).toHaveLength(1);
    });

    it("checks the chat user's permissions", async () => {
      const s = settings((s) => {
        s.permissions.all = false;
        s.permissions.followers = true;
      });

      expect(await say(chat("hi"), s)).toEqual([]);
      expect(await say(chat("hi", { ...viewer, follower: true }), s)).toEqual([
        "hi",
      ]);
    });
  });

  describe("text", () => {
    it("fills the template variables", async () => {
      const s = settings((s) => {
        s.format.template = "{username} ({handle}) says {comment}";
      });

      expect(await say("hello", s)).toEqual(["Viewer (viewer) says hello"]);
    });

    it("reads the comment when the template has no variables", async () => {
      const s = settings((s) => {
        s.format.template = "static text";
      });

      expect(await say("hello", s)).toEqual(["hello"]);
    });

    it("replaces whole words, ignoring case", async () => {
      const s = settings((s) => {
        s.replacements = [{ old: "lol", new: "laughing" }];
      });

      expect(await say("LOL that is lolly", s)).toEqual([
        "laughing that is lolly",
      ]);
    });

    it("treats regex characters in replacements literally", async () => {
      const s = settings((s) => {
        s.replacements = [{ old: "a.c", new: "x" }];
      });

      expect(await say("abc a.c", s)).toEqual(["abc x"]);
    });

    it("replaces words that start or end with symbols", async () => {
      const s = settings((s) => {
        s.replacements = [
          { old: ":)", new: "smile" },
          { old: "c++", new: "c plus plus" },
        ];
      });

      expect(await say("I like c++ :) hi:)", s)).toEqual([
        "I like c plus plus smile hismile",
      ]);
    });

    it("treats accented letters as part of a word", async () => {
      const s = settings((s) => {
        s.replacements = [{ old: "qué", new: "what" }];
      });

      expect(await say("qué quéso", s)).toEqual(["what quéso"]);
    });

    it("inserts the new text literally and skips empty words", async () => {
      const s = settings((s) => {
        s.replacements = [
          { old: "", new: "!" },
          { old: "money", new: "$& $1" },
        ];
      });

      expect(await say("money", s)).toEqual(["$& $1"]);
    });
  });

  it("logs and skips a failed generation", async () => {
    vi.spyOn(service, "generateBuffer").mockResolvedValue({
      success: false,
      error: new Error("rate limited"),
    });
    const error = vi.spyOn(Logger, "error");

    expect(await say("hi")).toEqual([]);
    expect(error).toHaveBeenCalledWith(
      expect.stringContaining("rate limited"),
      undefined,
      expect.objectContaining({ message: "rate limited" }),
    );
  });

  it("calls onError when the generation fails", async () => {
    vi.spyOn(Logger, "error");
    const error = new Error("rate limited");
    vi.spyOn(service, "generateBuffer").mockResolvedValue({
      success: false,
      error,
    });
    const onAudio = vi.fn();
    const onError = vi.fn();

    service.talk(chat("hi"), settings(), onAudio, onError);
    await new Promise((r) => setTimeout(r));

    expect(onAudio).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledExactlyOnceWith(error);
  });

  it("clearTalk drops the waiting messages", async () => {
    const s = settings((s) => {
      s.protection.cooldown = 1;
    });
    const spoken: string[] = [];
    const record = (res: { data?: Buffer }) =>
      spoken.push(res.data?.toString() ?? "");

    service.talk(chat("first"), s, record);
    service.talk(chat("second"), s, record);
    await new Promise((r) => setTimeout(r));
    service.clearTalk();
    await new Promise((r) => setTimeout(r, 1100));

    expect(spoken).toEqual(["first"]);
  });

  it("returns no voices when the provider fails", async () => {
    vi.spyOn(Logger, "error");
    const provider = service["_current"]?.provider;
    vi.spyOn(provider!, "getVoices").mockRejectedValue(new Error("offline"));

    expect(await service.getVoices()).toEqual([]);
  });
});
