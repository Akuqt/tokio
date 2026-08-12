import { Profile, Theme } from "../schemas";
import { ServiceAppProvider, VoiceData } from "./store";

type WindowState = { state: "normal" | "maximized" };

export enum APP_EVENTS {
  // WINDOW
  MINIMIZE_WINDOW = "app:req:minimize:window",
  MAXIMIZE_WINDOW = "app:req:maximize:window",
  CLOSE_WINDOW = "app:req:close:window",
  RESIZE_WINDOW = "app:res:resize:window",

  // THEME
  GET_THEME = "app:get:theme",
  RES_GET_THEME = "app:res:theme",

  // PROFILE
  GET_PROFILE = "app:get:profile",
  RES_GET_PROFILE = "app:res:profile",
  SET_PROFILE = "app:set:profile",

  // SERVICE PROVIDERS
  GET_SERVICE_PROVIDERS = "app:get:service:providers",
  RES_GET_SERVICE_PROVIDERS = "app:res:service:providers",
  SET_SERVICE_PROVIDER = "app:set:service:provider",

  // VOICES
  GET_VOICES = "app:get:voices",
  RES_GET_VOICES = "app:res:voices",

  //TTS PAGE
  UPDATE_TTS_SETTINGS = "app:update:tts:settings",
  RES_UPDATE_TTS_SETTINGS = "app:res:update:tts:settings",

  // TTS PAGE TESTER
  GET_TTS_TEST = "app:get:tts:test",
  RES_GET_TTS_TEST = "app:res:tts:test",
}

export interface AppEventsMap {
  // WINDOW
  [APP_EVENTS.MINIMIZE_WINDOW]: void;
  [APP_EVENTS.MAXIMIZE_WINDOW]: void;
  [APP_EVENTS.CLOSE_WINDOW]: void;
  [APP_EVENTS.RESIZE_WINDOW]: WindowState;

  // THEME
  [APP_EVENTS.GET_THEME]: void;
  [APP_EVENTS.RES_GET_THEME]: {
    success: boolean;
    theme: Theme;
    mode: "dark" | "light";
  };

  // PROFILE
  [APP_EVENTS.GET_PROFILE]: void;
  [APP_EVENTS.RES_GET_PROFILE]: {
    success: boolean;
    profile: Profile;
    profiles: { name: string; file: string; active: boolean }[];
  };
  [APP_EVENTS.SET_PROFILE]: { file: string };

  // SERVICE PROVIDERS
  [APP_EVENTS.GET_SERVICE_PROVIDERS]: void;
  [APP_EVENTS.RES_GET_SERVICE_PROVIDERS]: {
    services: ServiceAppProvider[];
    success: boolean;
  };
  [APP_EVENTS.SET_SERVICE_PROVIDER]: {
    name: string;
    type: "tts" | "connector";
    key?: string;
  };

  //VOICES
  [APP_EVENTS.GET_VOICES]: void;
  [APP_EVENTS.RES_GET_VOICES]: {
    success: boolean;
    voices: VoiceData[];
  };

  //TTS PAGE
  [APP_EVENTS.UPDATE_TTS_SETTINGS]: {
    settings: Profile["tts"];
  };
  [APP_EVENTS.RES_UPDATE_TTS_SETTINGS]: {
    success: boolean;
  };

  //TTS PAGE TESTER
  [APP_EVENTS.GET_TTS_TEST]: {
    text: string;
    voice: VoiceData;
  };
  [APP_EVENTS.RES_GET_TTS_TEST]: {
    success: boolean;
    data: Uint8Array<ArrayBufferLike>;
  };
}
