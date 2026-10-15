import { Profile } from "@/common/schemas";
import { defaultProfile } from "@/common/util";
import { PermissionsAction, permissionHandlers, syncListTemps } from "@/helper";
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
  | { type: "setProvider"; payload: "YouTube" | "Spotify" }
  | { type: "setProviderKey"; payload: string }
  | { type: "setPlayControlEnabled"; payload: boolean }
  | { type: "setNextControlEnabled"; payload: boolean }
  | { type: "setLastControlEnabled"; payload: boolean }
  | { type: "setRevokeControlEnabled"; payload: boolean }
  | { type: "setPlayControlCommand"; payload: string }
  | { type: "setNextControlCommand"; payload: string }
  | { type: "setLastControlCommand"; payload: string }
  | { type: "setRevokeControlCommand"; payload: string }
  | { type: "setConnected"; payload: boolean }
  | { type: "toggleConnected" }
  | { type: "setLoading"; payload: boolean }
  | { type: "setProtectionCooldown"; payload: number }
  | { type: "setProtectionQueueLength"; payload: number }
  | PermissionsAction;

type ActionHandlers = {
  [K in MusicAction["type"]]: (
    draft: MusicState,
    action: Extract<MusicAction, { type: K }>,
  ) => void;
};

const actionHandlers: ActionHandlers = {
  ...permissionHandlers,
  initSettings: (draft, action) => {
    draft.settings = action.payload;
    draft.settingsTemp = action.payload;
    syncListTemps(draft);
  },
  setSettings: (draft, action) => {
    draft.settings = action.payload;
    syncListTemps(draft);
  },
  setSettingsTemp: (draft) => {
    draft.settingsTemp = draft.settings;
    syncListTemps(draft);
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
  setRevokeControlEnabled: (draft, action) => {
    draft.settings.constrols.revoke.enabled = action.payload;
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
  setRevokeControlCommand: (draft, action) => {
    draft.settings.constrols.revoke.command = action.payload;
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
