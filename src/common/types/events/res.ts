import { Profile, StoreSchema, Theme } from "../../schemas";
import { VoiceData } from "../store";

type WindowState = { state: "normal" | "maximized" };

export enum APP_EVENTS_RESPONSE {
  // INIT
  LOAD_APP = "app:load:res:all",

  // WINDOW
  RESIZE_WINDOW = "app:window:res:resize",

  // THEME
  GET_THEME = "app:theme:res",

  // PROFILE
  GET_PROFILE = "app:profile:res",

  // VOICES
  GET_VOICES = "app:tts:res:voices",

  //TTS PAGE
  UPDATE_TTS_SETTINGS = "app:tts:res:update:settings",

  // TTS PAGE TESTER
  GET_TTS_TEST = "app:tts:res:test",

  // SETTINGS
  GET_SETTINGS = "app:settings:res",
  CREATE_PROFILE = "app:settings:res:create:profile",
  CLONE_PROFILE = "app:settings:res:clone:profile",
  IMPORT_ENTITY = "app:settings:res:import:entity",
  EXPORT_ENTITY = "app:settings:res:export:entity",
  SET_PROVIDER = "app:settings:res:set:provider",
  SET_SERVER = "app:settings:res:set:server",
  REQ_FDQN = "app:settings:res:fqdn",
  SET_THEME = "app:settings:res:set:theme",
}

export interface AppEventsResponseMap {
  // INIT
  [APP_EVENTS_RESPONSE.LOAD_APP]: {
    success: boolean;
    data: {
      theme: {
        mode: "dark" | "light";
        data: Theme;
      };
    };
  };

  // WINDOW
  [APP_EVENTS_RESPONSE.RESIZE_WINDOW]: WindowState;

  // THEME
  [APP_EVENTS_RESPONSE.GET_THEME]: {
    success: boolean;
    theme?: Theme;
    mode?: "dark" | "light";
  };

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
    type: "theme" | "profile";
  };

  [APP_EVENTS_RESPONSE.EXPORT_ENTITY]: {
    success: boolean;
    type: "theme" | "profile";
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

  [APP_EVENTS_RESPONSE.SET_THEME]: {
    success: boolean;
  };
}
