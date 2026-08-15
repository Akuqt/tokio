import { Profile } from "@/common/schemas";
import { VoiceData } from "@/common/types";
import { produce } from "immer";

export interface TTSState {
  settings: Profile["tts"];
  settingsTemp: Profile["tts"];
  voices: VoiceData[];
  testMSG: string;
  blacklistTemp: string;
  whitelistTemp: string;
  bannedlistTemp: string;
  testLoading: boolean;
}

export type TTSAction =
  | { type: "initSettings"; payload: Profile["tts"] }
  | { type: "setSettings"; payload: Profile["tts"] }
  | { type: "setSettingsTemp" }
  | { type: "setVoice"; payload: VoiceData }
  | { type: "setVoices"; payload: VoiceData[] }
  | { type: "setSpeed"; payload: number }
  | { type: "setPitch"; payload: number }
  | { type: "setVolume"; payload: number }
  | { type: "setTestMSG"; payload: string }
  | { type: "setTestLoading"; payload: boolean }
  | {
      type: "setTrigger";
      payload: { mode: "any" | "dot" | "slash" | "custom"; value: string };
    }
  | { type: "setTemplate"; payload: string }
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
  | { type: "setProtectionCooldown"; payload: number }
  | { type: "setProtectionQueueLength"; payload: number }
  | { type: "setProtectionCommentLength"; payload: number }
  | { type: "setProtectionBanned"; payload: string[] }
  | { type: "setProtectionBannedTemp"; payload: string }
  | { type: "AddReplacements"; payload: { old: string; new: string } }
  | { type: "setReplacements"; payload: { old: string; new: string }[] };

type ActionHandlers = {
  [K in TTSAction["type"]]: (
    draft: TTSState,
    action: Extract<TTSAction, { type: K }>,
  ) => void;
};

const actionHandlers: ActionHandlers = {
  initSettings: (draft, action) => {
    draft.settings = action.payload;
    draft.settingsTemp = action.payload;
    draft.bannedlistTemp = action.payload.protection.banned.join(", ");
    draft.whitelistTemp = action.payload.permissions.list.white.join(", ");
    draft.blacklistTemp = action.payload.permissions.list.black.join(", ");
  },
  setSettings: (draft, action) => {
    draft.settings = action.payload;
    draft.bannedlistTemp = action.payload.protection.banned.join(", ");
    draft.whitelistTemp = action.payload.permissions.list.white.join(", ");
    draft.blacklistTemp = action.payload.permissions.list.black.join(", ");
  },
  setSettingsTemp: (draft) => {
    draft.settingsTemp = draft.settings;
    draft.bannedlistTemp = draft.settings.protection.banned.join(", ");
    draft.whitelistTemp = draft.settings.permissions.list.white.join(", ");
    draft.blacklistTemp = draft.settings.permissions.list.black.join(", ");
  },
  setVoice: (draft, action) => {
    draft.settings.voice = action.payload;
  },
  setVoices: (draft, action) => {
    draft.voices = action.payload;
  },
  setTestMSG: (draft, action) => {
    draft.testMSG = action.payload;
  },
  setSpeed: (draft, action) => {
    draft.settings.filters.speed = action.payload;
  },
  setPitch: (draft, action) => {
    draft.settings.filters.pitch = action.payload;
  },
  setVolume: (draft, action) => {
    draft.settings.filters.volume = action.payload;
  },
  setTrigger: (draft, action) => {
    draft.settings.format.trigger = action.payload;
  },
  setTemplate: (draft, action) => {
    draft.settings.format.template = action.payload;
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
  setProtectionCooldown: (draft, action) => {
    draft.settings.protection.cooldown = action.payload;
  },
  setProtectionQueueLength: (draft, action) => {
    draft.settings.protection.queue_length = action.payload;
  },
  setProtectionCommentLength: (draft, action) => {
    draft.settings.protection.comment_length = action.payload;
  },
  setProtectionBanned: (draft, action) => {
    draft.settings.protection.banned = action.payload;
  },
  setProtectionBannedTemp: (draft, action) => {
    draft.bannedlistTemp = action.payload;
  },
  AddReplacements: (draft, action) => {
    draft.settings.replacements.push(action.payload);
  },
  setReplacements: (draft, action) => {
    draft.settings.replacements = action.payload;
  },
  setTestLoading: (draft, action) => {
    draft.testLoading = action.payload;
  },
};

export const reducer = produce((draft: TTSState, action: TTSAction) => {
  const handler = actionHandlers[action.type] as any;
  if (handler) {
    handler(draft, action);
  }
});
