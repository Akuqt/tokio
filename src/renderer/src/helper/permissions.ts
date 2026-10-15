import { Permissions } from "@/common/schemas";

// Permission settings shared by the TTS and Music pages.

export type PermissionsAction =
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
  | { type: "setPermissionsListBlackTemp"; payload: string };

export interface PermissionsState {
  settings: { permissions: Permissions };
  whitelistTemp: string;
  blacklistTemp: string;
}

type PermissionHandlers = {
  [K in PermissionsAction["type"]]: (
    draft: PermissionsState,
    action: Extract<PermissionsAction, { type: K }>,
  ) => void;
};

export const permissionHandlers: PermissionHandlers = {
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
};

/**
 * Refreshes the editable whitelist and blacklist text from the saved lists.
 */
export function syncListTemps(draft: PermissionsState) {
  draft.whitelistTemp = draft.settings.permissions.list.white.join(", ");
  draft.blacklistTemp = draft.settings.permissions.list.black.join(", ");
}
