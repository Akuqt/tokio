import { Profile } from "@/common/schemas";
import { ChatEvent } from "@/common/types";
import { formatError, TaskQueue } from "@/common/util";
import Logger from "@/logger";
import { ProviderService } from "../shared";
import { GenerationResponse, TTSProvider, VoiceData } from "./common";
import { TikTokTTS, WindowsTTS } from "./providers";

export class TTSService extends ProviderService<TTSProvider> {
  private _queue: TaskQueue;

  constructor() {
    super();
    this._queue = new TaskQueue();
    this.addProvider("Default", new TikTokTTS(), true); // NOTE: DO NOT CHANGE, Add your providers below.
    if (process.platform === "win32") {
      this.addProvider("Windows", new WindowsTTS());
    }
  }

  protected override _validProvider(provider: TTSProvider): boolean {
    return provider instanceof TTSProvider;
  }

  public async getVoices(): Promise<VoiceData[]> {
    if (!this._current?.provider) return [];
    try {
      return await this._current.provider.getVoices();
    } catch (e) {
      Logger.error(
        `<tts> Unable to get voices - ${formatError(e)}`,
        this._logFile,
      );
      return [];
    }
  }

  public async getDefaultVoice(): Promise<VoiceData | null> {
    if (!this._current?.provider) return null;
    try {
      return await this._current.provider.getDefaultVoice();
    } catch (e) {
      Logger.error(
        `<tts> Unable to get default voice - ${formatError(e)}`,
        this._logFile,
      );
      return null;
    }
  }

  public dispose() {
    for (const provider of this._providerPool?.values() ?? []) {
      provider.dispose();
    }
  }

  public async generateBuffer(
    text: string,
    lang?: string,
    voice?: string,
  ): Promise<GenerationResponse> {
    if (!this._current?.provider) return { success: false };
    const res = await this._current.provider.generateBuffer(text, lang, voice);
    return res;
  }

  private _valid(settings: Profile["tts"], chat: ChatEvent) {
    if (chat.comment.content === "") return false;
    if (settings.format.trigger.mode !== "any") {
      if (!chat.comment.content.startsWith(settings.format.trigger.value)) {
        return false;
      }
    }

    const contentLower = chat.comment.content.toLowerCase();
    const banned = settings.protection.banned.some((b) =>
      contentLower.includes(b.toLowerCase()),
    );
    const over_length =
      chat.comment.content.length > settings.protection.comment_length;

    if (banned || over_length) return false;

    if (settings.permissions.all) return true;

    if (settings.permissions.list.enabled) {
      const handle = chat.user.handle;
      const { black, white } = settings.permissions.list;

      return (
        !black.includes(handle) &&
        (white.length === 0 || white.includes(handle))
      );
    }

    const passedRoles: boolean[] = [];

    if (settings.permissions.followers) {
      passedRoles.push(chat.user.follower ?? false);
    }
    if (settings.permissions.moderators) {
      passedRoles.push(chat.user.moderator ?? false);
    }
    if (settings.permissions.superfans) {
      passedRoles.push(chat.user.superfan ?? false);
    }
    if (settings.permissions.level.enabled) {
      passedRoles.push(
        (chat.user.fanLevel ?? 0) >= settings.permissions.level.value,
      );
    }

    if (passedRoles.length > 0) {
      return passedRoles.some((passed) => passed === true);
    }

    return true;
  }

  private _escapeRegExp(str: string) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  private _parseText(settings: Profile["tts"], chat: ChatEvent) {
    let template = settings.format?.template;
    const originalTemplate = template;

    let isValidTemplate = template && template.trim() !== "";

    if (isValidTemplate) {
      const variables = [
        { label: "{username}", value: chat.user.username },
        { label: "{comment}", value: chat.comment.content },
        { label: "{handle}", value: chat.user.handle },
      ];

      for (const variable of variables) {
        template = template.replaceAll(variable.label, variable.value);
      }

      if (template === originalTemplate) {
        isValidTemplate = false;
      }
    }

    if (!isValidTemplate) {
      template = chat.comment.content;
    }

    if (settings.replacements && settings.replacements.length > 0) {
      for (const repl of settings.replacements) {
        const escapedOld = this._escapeRegExp(repl.old);
        const regex = new RegExp(`\\b${escapedOld}\\b`, "gi");
        template = template.replace(regex, repl.new);
      }
    }

    return template;
  }

  public clearTalk() {
    this._queue.stop();
  }

  public talk(
    chat: ChatEvent,
    settings: Profile["tts"],
    callback?: (res: {
      data: GenerationResponse["buffer"];
      filters: Profile["tts"]["filters"];
      queueOptions: {
        gapTime: number;
        maxQueueLength: number;
      };
    }) => void,
  ) {
    if (!this._valid(settings, chat)) return;
    const text = this._parseText(settings, chat);
    this._queue.setQueueOptions({
      gapTime: settings.protection.cooldown,
      maxQueueLength: settings.protection.queue_length,
    });
    this._queue.enqueue(async () => {
      const res = await this.generateBuffer(
        text,
        settings.voice.lang,
        settings.voice.name,
      );
      if (res.success) {
        callback?.({
          data: res.buffer,
          filters: settings.filters,
          queueOptions: {
            gapTime: settings.protection.cooldown,
            maxQueueLength: settings.protection.queue_length,
          },
        });
      } else {
        Logger.error(
          `<tts> Unable to generate audio - ${formatError(res.error)}`,
          this._logFile,
        );
      }
    });
  }
}
