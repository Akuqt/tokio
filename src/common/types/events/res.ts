import {
  CustomGift,
  MyInstantsSound,
  OverlayConfigRedux,
  TokioPayload,
} from "..";
import {
  Alert,
  AlertSound,
  OverlayConfig,
  Profile,
  StoreSchema,
} from "../../schemas";
import { OverlayApp } from "../server";
import { VoiceData } from "../store";

type WindowState = { state: "normal" | "maximized" };

export enum APP_EVENTS_RESPONSE {
  // INIT
  LOAD_APP = "app:load:res:all",

  // GLOBAL

  TTS_AUDIO = "app:tts:audio",

  // WINDOW
  RESIZE_WINDOW = "app:window:res:resize",
  RESIZE_MUSIC_WINDOW = "app:music:window:res:resize",

  // PROFILE
  GET_PROFILE = "app:profile:res",

  // VOICES
  GET_VOICES = "app:tts:res:voices",

  //TTS PAGE
  UPDATE_TTS_SETTINGS = "app:tts:res:update:settings",

  // TTS PAGE TESTER
  GET_TTS_TEST = "app:tts:res:test",

  //MUSIC PAGE
  UPDATE_MUSIC_SETTINGS = "app:music:res:update:settings",
  MUSIC_CONNECTED = "app:music:res:music:connected",

  // SETTINGS
  GET_SETTINGS = "app:settings:res",
  CREATE_PROFILE = "app:settings:res:create:profile",
  CLONE_PROFILE = "app:settings:res:clone:profile",
  IMPORT_ENTITY = "app:settings:res:import:entity",
  EXPORT_ENTITY = "app:settings:res:export:entity",
  SET_PROVIDER = "app:settings:res:set:provider",
  SET_SERVER = "app:settings:res:set:server",
  REQ_FDQN = "app:settings:res:fqdn",

  //HOME
  CONNECTED = "app:home:res:connect",
  VIEWS = "app:home:res:views",
  LIKES = "app:home:res:likes",

  // OVERLAYS
  IMPORT_OVERLAY = "app:overlays:res:add",
  GET_OVERLAYS = "app:overlays:res:get",
  GET_OVERLAY_CONFIG = "app:overlays:res:get:config",
  SAVE_OVERLAY_CONFIG = "app:overlays:res:save:config",
  GET_GIFTS = "app:overlays:res:get:gifts",
  TEST_OVERLAY = "app:overlays:res:test",

  // ALERTS
  ALERT_AUDIO = "app:alerts:audio",
  ALERT_CLEAR = "app:alerts:clear",
  TEST_ALERT = "app:alerts:res:test",
  UPDATE_ALERTS_SETTINGS = "app:alerts:res:update:settings",
  SEARCH_SOUNDS = "app:alerts:res:search:sounds",
  SET_ALERT_SOUND = "app:alerts:res:set:sound",

  // SOUND LIBRARY
  GET_SOUNDS = "app:sounds:res",
}

export interface AppEventsResponseMap {
  // INIT
  [APP_EVENTS_RESPONSE.LOAD_APP]: {
    success: boolean;
  };

  // GLOBAL

  [APP_EVENTS_RESPONSE.TTS_AUDIO]: {
    data: Uint8Array<ArrayBufferLike>;
    filters: Profile["tts"]["filters"];
    queueOptions: {
      gapTime: number;
      maxQueueLength: number;
    };
  };

  // WINDOW
  [APP_EVENTS_RESPONSE.RESIZE_WINDOW]: WindowState;

  [APP_EVENTS_RESPONSE.RESIZE_MUSIC_WINDOW]: WindowState;

  // PROFILE
  [APP_EVENTS_RESPONSE.GET_PROFILE]: {
    success: boolean;
    profile?: Profile;
    profiles?: { name: string; file: string }[];
  };

  //VOICES
  [APP_EVENTS_RESPONSE.GET_VOICES]: {
    success: boolean;
    voices?: VoiceData[];
  };

  //TTS PAGE
  [APP_EVENTS_RESPONSE.UPDATE_TTS_SETTINGS]: {
    success: boolean;
  };

  //TTS PAGE TESTER
  [APP_EVENTS_RESPONSE.GET_TTS_TEST]: {
    success: boolean;
    data?: Uint8Array<ArrayBufferLike>;
  };

  //MUSIC PAGE
  [APP_EVENTS_RESPONSE.UPDATE_MUSIC_SETTINGS]: {
    success: boolean;
  };

  [APP_EVENTS_RESPONSE.MUSIC_CONNECTED]: {
    success: boolean;
  };

  // SETTINGS
  [APP_EVENTS_RESPONSE.GET_SETTINGS]: {
    success: boolean;
    data?: StoreSchema;
  };

  [APP_EVENTS_RESPONSE.CREATE_PROFILE]: {
    success: boolean;
  };

  [APP_EVENTS_RESPONSE.CLONE_PROFILE]: {
    success: boolean;
  };

  [APP_EVENTS_RESPONSE.IMPORT_ENTITY]: {
    success: boolean;
    type: "profile";
  };

  [APP_EVENTS_RESPONSE.EXPORT_ENTITY]: {
    success: boolean;
    type: "profile";
  };

  [APP_EVENTS_RESPONSE.SET_PROVIDER]: {
    type: "tts" | "connector";
    success: boolean;
  };

  [APP_EVENTS_RESPONSE.SET_SERVER]: {
    success: boolean;
  };

  [APP_EVENTS_RESPONSE.REQ_FDQN]: {
    success: boolean;
  };

  // HOME
  [APP_EVENTS_RESPONSE.CONNECTED]: {
    success: boolean;
    stats: {
      views: number;
      viewers: number;
      likes: number;
    };
  };

  [APP_EVENTS_RESPONSE.VIEWS]: {
    data: {
      views: number;
      viewers: number;
    };
  };
  [APP_EVENTS_RESPONSE.LIKES]: {
    likes: number;
  };

  // OVERLAYS
  [APP_EVENTS_RESPONSE.IMPORT_OVERLAY]: {
    success: boolean;
  };
  [APP_EVENTS_RESPONSE.GET_OVERLAYS]: {
    success: boolean;
    data?: OverlayApp[];
  };
  [APP_EVENTS_RESPONSE.GET_OVERLAY_CONFIG]: {
    success: boolean;
    data?: OverlayConfig;
  };
  [APP_EVENTS_RESPONSE.GET_GIFTS]: {
    data: CustomGift[];
  };
  [APP_EVENTS_RESPONSE.SAVE_OVERLAY_CONFIG]: {
    success: boolean;
    data?: OverlayConfigRedux;
    id?: string;
  };
  [APP_EVENTS_RESPONSE.TEST_OVERLAY]: {
    payloads: TokioPayload[];
    id: string;
  };

  // ALERTS
  [APP_EVENTS_RESPONSE.ALERT_AUDIO]: {
    data: Uint8Array;
    volume: number;
    // Name of the renderer audio queue to play on
    channel: string;
    maxQueueLength: number;
    // Alert the sound belongs to, so volume changes reach it while playing
    id?: string;
  };
  // Drops queued and playing alert sounds
  [APP_EVENTS_RESPONSE.ALERT_CLEAR]: void;
  [APP_EVENTS_RESPONSE.TEST_ALERT]: {
    success: boolean;
    id: string;
    data?: Uint8Array;
    volume: number;
  };
  [APP_EVENTS_RESPONSE.UPDATE_ALERTS_SETTINGS]: {
    success: boolean;
  };
  [APP_EVENTS_RESPONSE.SEARCH_SOUNDS]: {
    success: boolean;
    // Echo of the request, so stale responses can be dropped
    query: string;
    page: number;
    data: MyInstantsSound[];
    hasNextPage: boolean;
  };
  [APP_EVENTS_RESPONSE.SET_ALERT_SOUND]: {
    success: boolean;
    id: string;
    sound?: Alert["sound"];
  };

  // SOUND LIBRARY
  [APP_EVENTS_RESPONSE.GET_SOUNDS]: {
    // false when the last upload or removal failed
    success: boolean;
    data: AlertSound[];
  };
}
