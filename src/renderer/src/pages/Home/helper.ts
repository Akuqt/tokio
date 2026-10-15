import { AppSettings, Profile } from "@/common/schemas";
import { defaultProfile, defaultStoreData } from "@/common/util";

import { produce } from "immer";

export interface HomeState {
  settings: AppSettings;
  profile: Profile;
  connected: boolean;
  loading: boolean;
  likes: number;
  views: { current: number; total: number };
}

export const defaultState: HomeState = {
  settings: defaultStoreData["settings"],
  profile: defaultProfile,
  likes: 0,
  views: {
    current: 0,
    total: 0,
  },
  connected: false,
  loading: false,
};

type HomeAction =
  | { type: "initSettings"; payload: AppSettings }
  | { type: "setProfile"; payload: Profile }
  | { type: "setUsername"; payload: string }
  | { type: "setTTSFeature"; payload: boolean }
  | { type: "setMusicFeature"; payload: boolean }
  | { type: "setAlertsFeature"; payload: boolean }
  | { type: "setLikes"; payload: number }
  | {
      type: "setViews";
      payload: { current: number; total: number };
    }
  | { type: "setConnected"; payload: boolean }
  | { type: "setLoading"; payload: boolean };

type ActionHandlers = {
  [K in HomeAction["type"]]: (
    draft: HomeState,
    action: Extract<HomeAction, { type: K }>,
  ) => void;
};

const actionHandlers: ActionHandlers = {
  initSettings: (draft, action) => {
    draft.settings = action.payload;
  },
  setProfile: (draft, action) => {
    draft.profile = action.payload;
  },
  setConnected: (draft, action) => {
    draft.connected = action.payload;
  },
  setLoading: (draft, action) => {
    draft.loading = action.payload;
  },
  setUsername: (draft, action) => {
    draft.profile.connector.username = action.payload;
  },
  setTTSFeature: (draft, action) => {
    draft.settings.activeFeatures.tts = action.payload;
  },
  setMusicFeature: (draft, action) => {
    draft.settings.activeFeatures.music = action.payload;
  },
  setAlertsFeature: (draft, action) => {
    draft.settings.activeFeatures.alerts = action.payload;
  },
  setLikes: (draft, action) => {
    draft.likes = action.payload;
  },
  setViews: (draft, action) => {
    draft.views = action.payload;
  },
};

const compactFormat = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const exactFormat = new Intl.NumberFormat("en-US");

export function formatStat(value: number) {
  return {
    short: compactFormat.format(value),
    full: exactFormat.format(value),
  };
}

export const reducer = produce((draft: HomeState, action: HomeAction) => {
  const handler = actionHandlers[action.type] as any;
  if (handler) {
    handler(draft, action);
  }
});
