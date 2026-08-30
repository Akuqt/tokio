import { Profile } from "@/common/schemas";
import { defaultProfile } from "@/common/util";
import { produce } from "immer";

export interface MusicState {
  settings: Profile["music"];
  settingsTemp: Profile["music"];
  blacklistTemp: string;
  whitelistTemp: string;
  connected: boolean;
  loading: boolean;
}

export const defaultState: MusicState = {
  settings: defaultProfile["music"],
  settingsTemp: defaultProfile["music"],
  blacklistTemp: "",
  whitelistTemp: "",
  connected: false,
  loading: false,
};

export type MusicAction =
  | { type: "initSettings"; payload: Profile["music"] }
  | { type: "setSettings"; payload: Profile["music"] }
  | { type: "setSettingsTemp" }
  | { type: "setPermissionsAll"; payload: boolean }
  | { type: "setPermissionsFollowers"; payload: boolean }
  | { type: "setPermissionsSuperfans"; payload: boolean }
  | { type: "setPermissionsModerators"; payload: boolean }
  | { type: "setPermissionsLevelEnabled"; payload: boolean }
  | { type: "setPermissionsLevelValue"; payload: number }
  | { type: "setPermissionsListEnabled"; payload: boolean }
  | { type: "setPermissionsListWhite"; payload: string[] }
  | { type: "setPermissionsListWhiteTemp"; payload: string }
  | { type: "setPermissionsListBlack"; payload: string[] }
  | { type: "setPermissionsListBlackTemp"; payload: string }
  | { type: "setProvider"; payload: "YouTube" | "Spotify" }
  | { type: "setProviderKey"; payload: string }
  | { type: "setPlayControlEnabled"; payload: boolean }
  | { type: "setNextControlEnabled"; payload: boolean }
  | { type: "setLastControlEnabled"; payload: boolean }
  | { type: "setPlayControlCommand"; payload: string }
  | { type: "setNextControlCommand"; payload: string }
  | { type: "setLastControlCommand"; payload: string }
  | { type: "setConnected"; payload: boolean }
  | { type: "toggleConnected" }
  | { type: "setLoading"; payload: boolean }
  | { type: "setProtectionCooldown"; payload: number }
  | { type: "setProtectionQueueLength"; payload: number };

type ActionHandlers = {
  [K in MusicAction["type"]]: (
    draft: MusicState,
    action: Extract<MusicAction, { type: K }>,
  ) => void;
};

const actionHandlers: ActionHandlers = {
  initSettings: (draft, action) => {
    draft.settings = action.payload;
    draft.settingsTemp = action.payload;
    draft.whitelistTemp = action.payload.permissions.list.white.join(", ");
    draft.blacklistTemp = action.payload.permissions.list.black.join(", ");
  },
  setSettings: (draft, action) => {
    draft.settings = action.payload;
    draft.whitelistTemp = action.payload.permissions.list.white.join(", ");
    draft.blacklistTemp = action.payload.permissions.list.black.join(", ");
  },
  setSettingsTemp: (draft) => {
    draft.settingsTemp = draft.settings;
    draft.whitelistTemp = draft.settings.permissions.list.white.join(", ");
    draft.blacklistTemp = draft.settings.permissions.list.black.join(", ");
  },
  setPermissionsAll: (draft, action) => {
    draft.settings.permissions.all = action.payload;
  },
  setPermissionsFollowers: (draft, action) => {
    draft.settings.permissions.followers = action.payload;
  },
  setPermissionsSuperfans: (draft, action) => {
    draft.settings.permissions.superfans = action.payload;
  },
  setPermissionsModerators: (draft, action) => {
    draft.settings.permissions.moderators = action.payload;
  },
  setPermissionsLevelEnabled: (draft, action) => {
    draft.settings.permissions.level.enabled = action.payload;
  },
  setPermissionsLevelValue: (draft, action) => {
    draft.settings.permissions.level.value = action.payload;
  },
  setPermissionsListEnabled: (draft, action) => {
    draft.settings.permissions.list.enabled = action.payload;
  },
  setPermissionsListWhite: (draft, action) => {
    draft.settings.permissions.list.white = action.payload;
  },
  setPermissionsListWhiteTemp: (draft, action) => {
    draft.whitelistTemp = action.payload;
  },
  setPermissionsListBlack: (draft, action) => {
    draft.settings.permissions.list.black = action.payload;
  },
  setPermissionsListBlackTemp: (draft, action) => {
    draft.blacklistTemp = action.payload;
  },
  setProvider: (draft, action) => {
    draft.settings.provider.name = action.payload;
  },
  setProviderKey: (draft, action) => {
    draft.settings.provider.key = action.payload;
  },
  setPlayControlEnabled: (draft, action) => {
    draft.settings.constrols.play.enabled = action.payload;
  },
  setNextControlEnabled: (draft, action) => {
    draft.settings.constrols.next.enabled = action.payload;
  },
  setLastControlEnabled: (draft, action) => {
    draft.settings.constrols.last.enabled = action.payload;
  },
  setPlayControlCommand: (draft, action) => {
    draft.settings.constrols.play.command = action.payload;
  },
  setNextControlCommand: (draft, action) => {
    draft.settings.constrols.next.command = action.payload;
  },
  setLastControlCommand: (draft, action) => {
    draft.settings.constrols.last.command = action.payload;
  },
  setConnected: (draft, action) => {
    draft.connected = action.payload;
  },
  toggleConnected: (draft) => {
    draft.connected = !draft.connected;
  },
  setLoading: (draft, action) => {
    draft.loading = action.payload;
  },
  setProtectionCooldown: (draft, action) => {
    draft.settings.protection.cooldown = action.payload;
  },
  setProtectionQueueLength: (draft, action) => {
    draft.settings.protection.queue_length = action.payload;
  },
};

export const reducer = produce((draft: MusicState, action: MusicAction) => {
  const handler = actionHandlers[action.type] as any;
  if (handler) {
    handler(draft, action);
  }
});
