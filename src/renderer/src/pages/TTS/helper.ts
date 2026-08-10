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

export const reducer = produce((draft: TTSState, action: TTSAction) => {
  switch (action.type) {
    case "initSettings":
      draft.settings = action.payload;
      draft.settingsTemp = action.payload;
      draft.bannedlistTemp = action.payload.protection.banned.join(", ");
      draft.whitelistTemp = action.payload.permissions.list.white.join(", ");
      draft.blacklistTemp = action.payload.permissions.list.black.join(", ");
      break;
    case "setSettings":
      draft.settings = action.payload;
      draft.bannedlistTemp = action.payload.protection.banned.join(", ");
      draft.whitelistTemp = action.payload.permissions.list.white.join(", ");
      draft.blacklistTemp = action.payload.permissions.list.black.join(", ");
      break;
    case "setSettingsTemp":
      draft.settingsTemp = draft.settings;
      draft.bannedlistTemp = draft.settings.protection.banned.join(", ");
      draft.whitelistTemp = draft.settings.permissions.list.white.join(", ");
      draft.blacklistTemp = draft.settings.permissions.list.black.join(", ");
      break;
    case "setVoice":
      draft.settings.voice = action.payload;
      break;
    case "setVoices":
      draft.voices = action.payload;
      break;
    case "setTestMSG":
      draft.testMSG = action.payload;
      break;
    case "setSpeed":
      draft.settings.filters.speed = action.payload;
      break;
    case "setPitch":
      draft.settings.filters.pitch = action.payload;
      break;
    case "setVolume":
      draft.settings.filters.volume = action.payload;
      break;
    case "setTrigger":
      draft.settings.format.trigger = action.payload;
      break;
    case "setTemplate":
      draft.settings.format.template = action.payload;
      break;
    case "setPermissionsAll":
      draft.settings.permissions.all = action.payload;
      break;
    case "setPermissionsFollowers":
      draft.settings.permissions.followers = action.payload;
      break;
    case "setPermissionsSuperfans":
      draft.settings.permissions.superfans = action.payload;
      break;
    case "setPermissionsModerators":
      draft.settings.permissions.moderators = action.payload;
      break;
    case "setPermissionsLevelEnabled":
      draft.settings.permissions.level.enabled = action.payload;
      break;
    case "setPermissionsLevelValue":
      draft.settings.permissions.level.value = action.payload;
      break;
    case "setPermissionsListEnabled":
      draft.settings.permissions.list.enabled = action.payload;
      break;
    case "setPermissionsListWhite":
      draft.settings.permissions.list.white = action.payload;
      break;
    case "setPermissionsListWhiteTemp":
      draft.whitelistTemp = action.payload;
      break;
    case "setPermissionsListBlack":
      draft.settings.permissions.list.black = action.payload;
      break;
    case "setPermissionsListBlackTemp":
      draft.blacklistTemp = action.payload;
      break;
    case "setProtectionCooldown":
      draft.settings.protection.cooldown = action.payload;
      break;
    case "setProtectionQueueLength":
      draft.settings.protection.queue_length = action.payload;
      break;
    case "setProtectionCommentLength":
      draft.settings.protection.comment_length = action.payload;
      break;
    case "setProtectionBanned":
      draft.settings.protection.banned = action.payload;
      break;
    case "setProtectionBannedTemp":
      draft.bannedlistTemp = action.payload;
      break;
    case "AddReplacements":
      draft.settings.replacements.push(action.payload);
      break;
    case "setReplacements":
      draft.settings.replacements = action.payload;
      break;
  }
});
