export interface UserData {
  username: string;
  handle: string;
  profilePictures: string[];
  superfan?: boolean;
  follower?: boolean;
  moderator?: boolean;
  fanLevel?: number;
}

export interface ChatEvent {
  user: UserData;
  comment: {
    content: string;
    emotes: Emotes[];
    lang: string;
  };
}

export interface Emotes {
  emoteID: string;
  index: number;
  images: string[];
}

export interface ShareEvent {
  shareCount: number;
  user: UserData;
}

interface SingleUserEvent {
  user: UserData;
}

export type FollowEvent = SingleUserEvent;

export type SuperFanEvent = SingleUserEvent;

export type MemberEvent = SingleUserEvent;

export type SuperFanJoinEvent = SingleUserEvent;

export interface GiftEvent {
  user: UserData;
  gift: {
    id: string;
    repeatEnd: boolean;
    type: number;
    name: string;
    comboCount: number;
  };
}

export interface LikeEvent {
  user: UserData;
  likeCount: number;
  totalLikes: number;
}

export interface Gift {
  id: string;
  name: string;
  coins: number;
  image: string;
}

export enum TIKTOK_EVENTS {
  CONNECTED = "tiktok:connected",
  DISCONNECTED = "tiktok:disconnected",
  CHAT = "tiktok:chat",
  SHARE = "tiktok:share",
  FOLLOW = "tiktok:follow",
  GIFT = "tiktok:gift",
  LIKE = "tiktok:like",
  ENVELOPE = "tiktok:envelope",
  SUPER_FAN = "tiktok:superfan",
  SUPER_FAN_BOX = "tiktok:superfanbox",
  SUPER_FAN_JOIN = "tiktok:superfanjoin",
  MEMBER_JOIN = "tiktok:memberjoin",
}

export interface TikTokEventMap {
  [TIKTOK_EVENTS.CONNECTED]: { success: boolean; error?: Error };
  [TIKTOK_EVENTS.DISCONNECTED]: void;
  [TIKTOK_EVENTS.CHAT]: ChatEvent;
  [TIKTOK_EVENTS.SHARE]: ShareEvent;
  [TIKTOK_EVENTS.FOLLOW]: FollowEvent;
  [TIKTOK_EVENTS.GIFT]: GiftEvent;
  [TIKTOK_EVENTS.LIKE]: LikeEvent;
  [TIKTOK_EVENTS.ENVELOPE]: void;
  [TIKTOK_EVENTS.SUPER_FAN_BOX]: void;
  [TIKTOK_EVENTS.SUPER_FAN]: SuperFanEvent;
  [TIKTOK_EVENTS.MEMBER_JOIN]: MemberEvent;
  [TIKTOK_EVENTS.SUPER_FAN_JOIN]: SuperFanJoinEvent;
}
