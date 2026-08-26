import { Profile } from "../../schemas";
import { VoiceData } from "../store";

export enum APP_EVENTS {
  // INIT
  LOAD_APP = "app:load:all",

  // WINDOW
  MINIMIZE_WINDOW = "app:window:req:minimize",
  MAXIMIZE_WINDOW = "app:window:req:maximize",
  CLOSE_WINDOW = "app:window:req:close",

  // THEME
  GET_THEME = "app:theme:get",
  SET_THEME_MODE = "app:theme:set:mode",

  // PROFILE
  GET_PROFILE = "app:profile:get",
  SET_PROFILE = "app:profile:set",

  // VOICES
  GET_VOICES = "app:tts:get:voices",

  //TTS PAGE
  UPDATE_TTS_SETTINGS = "app:tts:update:settings",

  // TTS PAGE TESTER
  GET_TTS_TEST = "app:tts:get:test",

  // SETTINGS
  GET_SETTINGS = "app:settings:get",
  CREATE_PROFILE = "app:settings:create:profile",
  CLONE_PROFILE = "app:settings:clone:profile",
  IMPORT_ENTITY = "app:settings:import:entity",
  EXPORT_ENTITY = "app:settings:export:entity",
  SET_PROVIDER = "app:settings:set:provider",
  SET_SERVER = "app:settings:set:server",
  REQ_FDQN = "app:settings:req:fqdn",
  SET_THEME = "app:settings:set:theme",

  // HOME
  CONNECT = "app:home:connect",
  DISCONNECT = "app:home:disconnect",
  IS_CONNECTED = "app:home:isconnected",
  ACTIVE_FEATURES = "app:home:activefeatures",
}

export interface AppEventsMap {
  // INIT
  [APP_EVENTS.LOAD_APP]: void;

  // WINDOW
  [APP_EVENTS.MINIMIZE_WINDOW]: void;
  [APP_EVENTS.MAXIMIZE_WINDOW]: void;
  [APP_EVENTS.CLOSE_WINDOW]: void;

  // THEME
  [APP_EVENTS.GET_THEME]: void;
  [APP_EVENTS.SET_THEME_MODE]: {
    mode: "dark" | "light";
  };

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
    type: "profile" | "theme";
  };

  [APP_EVENTS.EXPORT_ENTITY]: {
    type: "profile" | "theme";
    file: string;
  };

  [APP_EVENTS.SET_PROVIDER]: {
    name: string;
    key: string;
    type: "connector" | "tts";
  };

  [APP_EVENTS.SET_SERVER]: {
    enabled: boolean;
    port: number;
  };

  [APP_EVENTS.REQ_FDQN]: void;

  [APP_EVENTS.SET_THEME]: {
    file: string;
    mode: "dark" | "light";
  };

  // HOME
  [APP_EVENTS.CONNECT]: {
    username: string;
  };
  [APP_EVENTS.DISCONNECT]: void;
  [APP_EVENTS.IS_CONNECTED]: void;
  [APP_EVENTS.ACTIVE_FEATURES]: {
    tts: boolean;
  };
}
