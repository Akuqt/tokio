import { CustomGift, TokioPayload } from "..";
import { OverlayConfig, Profile } from "../../schemas";
import { VoiceData } from "../store";

export enum APP_EVENTS {
  // INIT
  LOAD_APP = "app:load:all",

  // WINDOW
  MINIMIZE_WINDOW = "app:window:req:minimize",
  MAXIMIZE_WINDOW = "app:window:req:maximize",
  CLOSE_WINDOW = "app:window:req:close",

  MINIMIZE_MUSIC_WINDOW = "app:music:window:req:minimize",
  MAXIMIZE_MUSIC_WINDOW = "app:music:window:req:maximize",
  CLOSE_MUSIC_WINDOW = "app:music:window:req:close",

  // PROFILE
  GET_PROFILE = "app:profile:get",
  SET_PROFILE = "app:profile:set",

  // VOICES
  GET_VOICES = "app:tts:get:voices",

  //TTS PAGE
  UPDATE_TTS_SETTINGS = "app:tts:update:settings",

  // TTS PAGE TESTER
  GET_TTS_TEST = "app:tts:get:test",

  //MUSIC PAGE
  UPDATE_MUSIC_SETTINGS = "app:music:update:settings",
  CONNECT_MUSIC = "app:music:req:connect",
  DISCONNECT_MUSIC = "app:music:req:disconnect",
  IS_MUSIC_CONNECTED = "app:music:req:is:connected",

  // SETTINGS
  GET_SETTINGS = "app:settings:get",
  CREATE_PROFILE = "app:settings:create:profile",
  CLONE_PROFILE = "app:settings:clone:profile",
  IMPORT_ENTITY = "app:settings:import:entity",
  EXPORT_ENTITY = "app:settings:export:entity",
  SET_PROVIDER = "app:settings:set:provider",
  SET_SERVER = "app:settings:set:server",
  REQ_FDQN = "app:settings:req:fqdn",

  // HOME
  CONNECT = "app:home:connect",
  DISCONNECT = "app:home:disconnect",
  IS_CONNECTED = "app:home:isconnected",
  ACTIVE_FEATURES = "app:home:activefeatures",

  // OVERLAYS
  IMPORT_OVERLAY = "app:overlays:add",
  GET_OVERLAYS = "app:overlays:get",
  GET_OVERLAY_CONFIG = "app:overlays:get:config",
  SAVE_OVERLAY_CONFIG = "app:overlays:save:config",
  GET_GIFTS = "app:overlays:get:gifts",
  SEND_OVERLAY_DATA = "app:overlays:send:data",
  TEST_OVERLAY = "app:overlays:test",

  // ALERTS
  UPDATE_ALERTS_SETTINGS = "app:alerts:update:settings",
  SEARCH_SOUNDS = "app:alerts:search:sounds",
  DOWNLOAD_SOUND = "app:alerts:download:sound",
  IMPORT_SOUND = "app:alerts:import:sound",
  TEST_ALERT = "app:alerts:test",

  // SOUND LIBRARY
  GET_SOUNDS = "app:sounds:get",
  UPLOAD_SOUNDS = "app:sounds:upload",
  REMOVE_SOUND = "app:sounds:remove",
}

export interface AppEventsMap {
  // INIT
  [APP_EVENTS.LOAD_APP]: void;

  // WINDOW
  [APP_EVENTS.MINIMIZE_WINDOW]: void;
  [APP_EVENTS.MAXIMIZE_WINDOW]: void;
  [APP_EVENTS.CLOSE_WINDOW]: void;

  [APP_EVENTS.MINIMIZE_MUSIC_WINDOW]: void;
  [APP_EVENTS.MAXIMIZE_MUSIC_WINDOW]: void;
  [APP_EVENTS.CLOSE_MUSIC_WINDOW]: void;

  // PROFILE
  [APP_EVENTS.GET_PROFILE]: void;
  [APP_EVENTS.SET_PROFILE]: { file: string };

  //VOICES
  [APP_EVENTS.GET_VOICES]: void;

  //TTS PAGE
  [APP_EVENTS.UPDATE_TTS_SETTINGS]: {
    settings: Profile["tts"];
  };

  //TTS PAGE TESTER
  [APP_EVENTS.GET_TTS_TEST]: {
    text: string;
    voice: VoiceData;
  };

  //MUSIC PAGE
  [APP_EVENTS.UPDATE_MUSIC_SETTINGS]: {
    settings: Profile["music"];
  };

  [APP_EVENTS.CONNECT_MUSIC]: {
    name: string;
    key: string;
  };

  [APP_EVENTS.DISCONNECT_MUSIC]: void;
  [APP_EVENTS.IS_MUSIC_CONNECTED]: void;

  // SETTINGS
  [APP_EVENTS.GET_SETTINGS]: void;

  [APP_EVENTS.CREATE_PROFILE]: {
    name: string;
  };

  [APP_EVENTS.CLONE_PROFILE]: {
    name: string;
    ref: string;
  };

  [APP_EVENTS.IMPORT_ENTITY]: {
    type: "profile";
  };

  [APP_EVENTS.EXPORT_ENTITY]: {
    type: "profile";
    file: string;
  };

  [APP_EVENTS.SET_PROVIDER]: {
    name: string;
    key: string;
    type: "connector" | "tts";
  };

  [APP_EVENTS.SET_SERVER]: {
    enabled: boolean;
  };

  [APP_EVENTS.REQ_FDQN]: void;

  // HOME
  [APP_EVENTS.CONNECT]: {
    username: string;
  };
  [APP_EVENTS.DISCONNECT]: void;
  [APP_EVENTS.IS_CONNECTED]: void;
  [APP_EVENTS.ACTIVE_FEATURES]: {
    tts?: boolean;
    music?: boolean;
    alerts?: boolean;
  };

  // OVERLAYS
  [APP_EVENTS.IMPORT_OVERLAY]: {
    gifts: CustomGift[];
  };
  [APP_EVENTS.GET_OVERLAYS]: void;
  [APP_EVENTS.GET_OVERLAY_CONFIG]: { id: string };
  [APP_EVENTS.GET_GIFTS]: void;
  [APP_EVENTS.SAVE_OVERLAY_CONFIG]: {
    id: string;
    config: OverlayConfig;
    gifts: CustomGift[];
  };
  [APP_EVENTS.SEND_OVERLAY_DATA]: {
    id: string;
    payload: TokioPayload;
  };
  [APP_EVENTS.TEST_OVERLAY]: {
    id: string;
  };

  // ALERTS
  [APP_EVENTS.UPDATE_ALERTS_SETTINGS]: {
    settings: Profile["alerts"];
  };
  [APP_EVENTS.SEARCH_SOUNDS]: {
    // Without a query, trending sounds are returned.
    query?: string;
    page: number;
  };
  [APP_EVENTS.DOWNLOAD_SOUND]: {
    id: string;
    url: string;
    name: string;
  };
  [APP_EVENTS.IMPORT_SOUND]: {
    id: string;
  };
  [APP_EVENTS.TEST_ALERT]: ({ file: string } | { url: string }) & {
    volume: number;
    // Identifies the test: the alert id, or the url for previews
    id: string;
  };

  // SOUND LIBRARY
  [APP_EVENTS.GET_SOUNDS]: void;
  [APP_EVENTS.UPLOAD_SOUNDS]: void;
  [APP_EVENTS.REMOVE_SOUND]: {
    file: string;
  };
}
