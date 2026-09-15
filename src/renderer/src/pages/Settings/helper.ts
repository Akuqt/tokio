import { AppProvider, StoreSchema } from "@/common/schemas";
import { defaultEntity, defaultStoreData } from "@/common/util";

import { produce } from "immer";

export interface SettingsState {
  store: StoreSchema;
  newTTSProvider: Omit<AppProvider, "active">;
  newConnProvider: Omit<AppProvider, "active">;
  modal: {
    type: "newProfile" | "cloneProfile" | "confirmServer" | "none";
    value: boolean;
  };
  newProfileName: string;
  cloneProfile: {
    name: string;
    referenceFile: string;
  };
}

export const defaultState: SettingsState = {
  store: defaultStoreData,
  newTTSProvider: {
    key: "",
    name: "",
  },
  newConnProvider: {
    key: "",
    name: "",
  },
  modal: {
    type: "none",
    value: false,
  },
  newProfileName: "",
  cloneProfile: {
    name: "",
    referenceFile: "",
  },
};

export type SettingsAction =
  | { type: "initSettings"; payload: StoreSchema }
  | { type: "setActiveProfile"; payload: string }
  | { type: "setServerEnabled"; payload: boolean }
  | { type: "setNewTTSProviderName"; payload: string }
  | { type: "setNewTTSProviderKey"; payload: string }
  | { type: "setNewConnProviderName"; payload: string }
  | { type: "setNewConnProviderKey"; payload: string }
  | { type: "setServerModal"; payload: boolean }
  | { type: "setNewProfileModal"; payload: boolean }
  | { type: "setCloneProfileModal"; payload: boolean }
  | { type: "clearModal" }
  | { type: "setNewProfileName"; payload: string }
  | {
      type: "setCloneProfile";
      payload: {
        name: string;
        referenceFile: string;
      };
    };

type ActionHandlers = {
  [K in SettingsAction["type"]]: (
    draft: SettingsState,
    action: Extract<SettingsAction, { type: K }>,
  ) => void;
};

const actionHandlers: ActionHandlers = {
  initSettings: (draft, action) => {
    draft.store = action.payload;
    draft.newTTSProvider = action.payload.settings.activeTTSProvider;
    draft.newConnProvider = action.payload.settings.activeConnProvider;
    draft.cloneProfile.referenceFile =
      action.payload.settings.activeProfile.file;
    draft.cloneProfile.name = action.payload.settings.activeProfile.name;
  },
  setActiveProfile: (draft, action) => {
    draft.store.settings.activeProfile =
      draft.store.profiles.find((p) => p.file === action.payload) ||
      defaultEntity;
  },
  setServerEnabled: (draft, action) => {
    draft.store.settings.server.enabled = action.payload;
  },
  setNewTTSProviderName: (draft, action) => {
    draft.newTTSProvider.name = action.payload;
  },
  setNewTTSProviderKey: (draft, action) => {
    draft.newTTSProvider.key = action.payload;
  },
  setNewConnProviderName: (draft, action) => {
    draft.newConnProvider.name = action.payload;
  },
  setNewConnProviderKey: (draft, action) => {
    draft.newConnProvider.key = action.payload;
  },
  setServerModal: (draft, action) => {
    draft.modal = { type: "confirmServer", value: action.payload };
  },
  setNewProfileModal: (draft, action) => {
    draft.modal = { type: "newProfile", value: action.payload };
  },
  setCloneProfileModal: (draft, action) => {
    draft.modal = { type: "cloneProfile", value: action.payload };
  },
  clearModal: (draft) => {
    draft.modal = { type: "none", value: false };
  },
  setNewProfileName: (draft, action) => {
    draft.newProfileName = action.payload;
  },
  setCloneProfile: (draft, action) => {
    draft.cloneProfile = action.payload;
  },
};

export const reducer = produce(
  (draft: SettingsState, action: SettingsAction) => {
    const handler = actionHandlers[action.type] as any;
    if (handler) {
      handler(draft, action);
    }
  },
);
