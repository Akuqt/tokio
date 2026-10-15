import { Profile } from "@/common/schemas";
import { VoiceData } from "@/common/types";
import { PermissionsAction, permissionHandlers, syncListTemps } from "@/helper";
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
  | { type: "setProtectionCooldown"; payload: number }
  | { type: "setProtectionQueueLength"; payload: number }
  | { type: "setProtectionCommentLength"; payload: number }
  | { type: "setProtectionBanned"; payload: string[] }
  | { type: "setProtectionBannedTemp"; payload: string }
  | { type: "AddReplacements"; payload: { old: string; new: string } }
  | { type: "setReplacements"; payload: { old: string; new: string }[] }
  | PermissionsAction;

type ActionHandlers = {
  [K in TTSAction["type"]]: (
    draft: TTSState,
    action: Extract<TTSAction, { type: K }>,
  ) => void;
};

const actionHandlers: ActionHandlers = {
  ...permissionHandlers,
  initSettings: (draft, action) => {
    draft.settings = action.payload;
    draft.settingsTemp = action.payload;
    draft.bannedlistTemp = action.payload.protection.banned.join(", ");
    syncListTemps(draft);
  },
  setSettings: (draft, action) => {
    draft.settings = action.payload;
    draft.bannedlistTemp = action.payload.protection.banned.join(", ");
    syncListTemps(draft);
  },
  setSettingsTemp: (draft) => {
    draft.settingsTemp = draft.settings;
    draft.bannedlistTemp = draft.settings.protection.banned.join(", ");
    syncListTemps(draft);
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
