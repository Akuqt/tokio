import {
  ChatEvent,
  FollowEvent,
  GiftEvent,
  LikeEvent,
  LoggerOptions,
  ShareEvent,
  TIKTOK_EVENTS,
  TikTokEventMap,
  UserData,
} from "@/common/types";
import { delay, formatError } from "@/common/util";
import Logger from "@/logger";
import { EventEmitter } from "events";
import {
  TikTokLiveConnection,
  User,
  UserIdentity,
  WebcastEvent,
} from "tiktok-live-connector";
import config from "../config";

export class TikTokLiveConnector extends EventEmitter {
  private _connector: TikTokLiveConnection | null;
  private _sessionID: string;
  private _username: string;
  private _logSettings: LoggerOptions;

  constructor() {
    super();
    this._connector = null;
    this._username = "";
    this._sessionID = "";
    this._logSettings = {
      file: false,
      path: "",
    };
  }

  // --- PUBLIC API ---

  public setSessionID(sessionID: string) {
    this._sessionID = sessionID;
  }

  public setLogOptions(options: LoggerOptions) {
    this._logSettings = options;
  }

  public async connect(username: string, sessionID?: string): Promise<void> {
    if (this.isConnected()) {
      return;
    }
    this._username = username.replace("@", "") || "";
    this._sessionID = sessionID || "";
    if (!this._username) {
      return;
    }
    Logger.info(
      `<Connector> Connecting to: ${this._username}`,
      this._logSettings,
    );
    this._connector = new TikTokLiveConnection(this._username, {
      processInitialData: false,
      session: {
        cookie: {
          type: "cookie",
          value: {
            sessionId: this._sessionID,
            ttTargetIdc: "alisg",
          },
        },
      },
    });
    try {
      const state = await this._connector.connect();
      if (state.isConnected) {
        Logger.success(
          `Connected to ${this._username} with roomID: ${state.roomId}`,
          this._logSettings,
        );
        this.emit(TIKTOK_EVENTS.CONNECTED);
        await delay(1000);
        this.registerEvents();
        this._connector.on(WebcastEvent.STREAM_END, async () => {
          this.emit(TIKTOK_EVENTS.DISCONNECTED);
          await this.disconnect();
          Logger.info(`Disconnected from ${this._username}`, this._logSettings);
        });
      }
    } catch (err) {
      Logger.error(
        `<Connector> Failed to connect to ${this._username} -- ${formatError(err)}`,
        this._logSettings,
      );
    }
  }

  public async disconnect(): Promise<void> {
    if (this.isConnected()) {
      await this._connector?.disconnect();
    }
  }

  public isConnected(): boolean {
    return this._connector?.isConnected ?? false;
  }

  // -- Private API --

  private registerEvents(): void {
    if (!this._connector) return;

    this._connector.on(WebcastEvent.SHARE, (tdata) => {
      const user = this.getUserData({
        user: tdata.user,
      });
      const shareCount = tdata.shareCount || 0;
      const data: ShareEvent = {
        shareCount,
        user,
      };
      this.emit(TIKTOK_EVENTS.SHARE, data);
    });

    this._connector.on(WebcastEvent.FOLLOW, (tdata) => {
      const user = this.getUserData({
        user: tdata.user,
      });
      const data: FollowEvent = {
        user,
      };
      this.emit(TIKTOK_EVENTS.SHARE, data);
    });

    this._connector.on(WebcastEvent.CHAT, (tdata) => {
      const user = this.getUserData({
        user: tdata.user,
        userIdentity: tdata.userIdentity,
      });
      const emotes: {
        emoteID: string;
        images: string[];
        index: number;
      }[] = [];
      if (tdata.emotes.length > 0) {
        for (const em of tdata.emotes) {
          emotes.push({
            emoteID: em.emote?.emoteId || "",
            images: em.emote?.image?.urlList ?? [],
            index: em.index,
          });
        }
      }
      const comment = {
        content: tdata.content,
        emotes: emotes,
        lang: tdata.contentLanguage,
      };
      const data: ChatEvent = {
        user,
        comment,
      };
      this.emit(TIKTOK_EVENTS.CHAT, data);
    });

    this._connector.on(WebcastEvent.GIFT, (tdata) => {
      const user = this.getUserData({
        user: tdata.user,
      });
      const gift = {
        id: tdata.giftId ?? "",
        type: tdata.gift?.type ?? 1,
        name: tdata.gift?.name ?? "",
        repeatEnd: (tdata.repeatEnd ?? 1) == 1,
        comboCount: tdata.repeatCount ?? 0,
      };
      const data: GiftEvent = {
        user,
        gift,
      };
      this.emit(TIKTOK_EVENTS.GIFT, data);
    });

    this._connector.on(WebcastEvent.LIKE, (tdata) => {
      const user = this.getUserData({
        user: tdata.user,
      });
      const data: LikeEvent = {
        user,
        likeCount: tdata.count ?? 0,
        totalLikes: Number(tdata.total ?? "0"),
      };
      this.emit(TIKTOK_EVENTS.LIKE, data);
    });

    this._connector.on(WebcastEvent.ENVELOPE, () => {
      this.emit(TIKTOK_EVENTS.ENVELOPE);
    });

    this._connector.on(WebcastEvent.SUPER_FAN_BOX, () => {
      this.emit(TIKTOK_EVENTS.SUPER_FAN_BOX);
    });

    this._connector.on(WebcastEvent.SUPER_FAN, (tdata) => {
      const user = this.getUserData({ user: tdata.user });
      this.emit(TIKTOK_EVENTS.SUPER_FAN, {
        user,
      });
    });

    this._connector.on(WebcastEvent.MEMBER, (tdata) => {
      const user = this.getUserData({ user: tdata.user });
      this.emit(TIKTOK_EVENTS.MEMBER_JOIN, { user });
    });

    this._connector.on(WebcastEvent.SUPER_FAN_JOIN, (tdata) => {
      const user = this.getUserData({ user: tdata.user });
      this.emit(TIKTOK_EVENTS.SUPER_FAN_JOIN, { user });
    });

    // END
    Logger.success(
      `<Connector> Event listeners registered for ${this._username}`,
      this._logSettings,
    );
  }

  public async fetchRegionGiftList(): Promise<any[]> {
    try {
      const region = await this.getUserRegionAndLanguage();
      const url = config.getGiftURL(region.region, region.language);

      const response = await fetch(url, {
        method: "GET",
        headers: config.HEADERS,
      });

      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

      const data = await response.json();
      const rawGifts =
        data?.data?.gifts ||
        data?.data?.giftList ||
        data?.data?.pages?.[0]?.gifts ||
        [];

      const availableGifts = rawGifts.map((g: any) => ({
        id: g.id,
        name: g.name,
        diamondCount: g.diamond_count,
        image: g.image?.url_list?.[0],
      }));

      return availableGifts;
    } catch (err) {
      Logger.error(
        `<Connector> Failed to fetch global gift list -- ${formatError(err)}`,
        this._logSettings,
      );
      return [];
    }
  }

  // --- HELPER METHODS ---

  private getUserData(tdata: {
    user?: User;
    userIdentity?: UserIdentity;
  }): UserData {
    return {
      username: tdata.user?.nickname || "",
      handle: tdata.user?.displayId || "",
      profilePictures: tdata.user?.avatarThumb?.urlList ?? [],
      superfan: tdata.userIdentity?.isSubscriberOfAnchor ?? false,
      follower: tdata.userIdentity?.isFollowerOfAnchor ?? false,
      moderator: tdata.userIdentity?.isModeratorOfAnchor ?? false,
      fanLevel: Number(
        tdata.user?.badgeList.find((b) =>
          b.combine?.icon?.uri.includes("fans_badge"),
        )?.privilegeLogExtra?.level || 0,
      ),
    };
  }

  public async getUserRegionAndLanguage(): Promise<{
    region: string;
    language: string;
  }> {
    try {
      const response = await fetch("https://ipapi.co/json/", {
        headers: config.HEADERS,
      });

      if (!response.ok) {
        throw new Error(`GeoIP API failed with status: ${response.status}`);
      }

      const data = await response.json();

      const region = data.country_code || "US";

      const firstLanguage = data.languages
        ? data.languages.split(",")[0]
        : "en-US";
      return { region, language: firstLanguage };
    } catch (err) {
      Logger.error(
        `<Connector> Failed to fetch IP location, falling back to US/en-US -- ${formatError(err)}`,
        this._logSettings,
      );
      return { region: "US", language: "en-US" };
    }
  }

  // --- OVERRIDE LOGIC ---

  override on<K extends TIKTOK_EVENTS>(
    event: K,
    listener: (data: TikTokEventMap[K]) => void,
  ): this;

  override on(event: string | symbol, listener: (...args: any[]) => void): this;

  override on(
    event: TIKTOK_EVENTS | string | symbol,
    listener: (...args: any[]) => void,
  ): this {
    return super.on(event, listener);
  }

  override emit<K extends TIKTOK_EVENTS>(
    event: K,
    data: TikTokEventMap[K],
  ): boolean;

  override emit(event: string | symbol, ...args: any[]): boolean;

  override emit(
    event: TIKTOK_EVENTS | string | symbol,
    ...args: any[]
  ): boolean {
    return super.emit(event, ...args);
  }
}
