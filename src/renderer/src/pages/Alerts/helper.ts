import { Alert, Profile } from "@/common/schemas";
import { CustomGift, TOKIO_EVENTS } from "@/common/types";
import { defaultProfile } from "@/common/util";
import { produce } from "immer";

export interface AlertsState {
  settings: Profile["alerts"];
  // Last saved settings
  settingsTemp: Profile["alerts"];
  gifts: CustomGift[];
  // Id of the alert whose sound is being picked
  pickerFor: string | null;
}

export const defaultState: AlertsState = {
  settings: defaultProfile["alerts"],
  settingsTemp: defaultProfile["alerts"],
  gifts: [],
  pickerFor: null,
};

export type AlertsAction =
  | { type: "initSettings"; payload: Profile["alerts"] }
  | { type: "setSettingsTemp"; payload: Profile["alerts"] }
  | { type: "setGifts"; payload: CustomGift[] }
  | { type: "setSimultaneous"; payload: boolean }
  | { type: "setQueueLength"; payload: number }
  | { type: "addAlert"; payload: Alert }
  | { type: "updateAlert"; payload: Alert }
  | { type: "removeAlert"; payload: string }
  | { type: "setAlertSound"; payload: { id: string; sound: Alert["sound"] } }
  | { type: "setPickerFor"; payload: string | null };

type ActionHandlers = {
  [K in AlertsAction["type"]]: (
    draft: AlertsState,
    action: Extract<AlertsAction, { type: K }>,
  ) => void;
};

const actionHandlers: ActionHandlers = {
  initSettings: (draft, action) => {
    draft.settings = action.payload;
    draft.settingsTemp = action.payload;
  },
  setSettingsTemp: (draft, action) => {
    draft.settingsTemp = action.payload;
  },
  setGifts: (draft, action) => {
    draft.gifts = action.payload;
  },
  setSimultaneous: (draft, action) => {
    draft.settings.simultaneous = action.payload;
  },
  setQueueLength: (draft, action) => {
    draft.settings.queue_length = action.payload;
  },
  addAlert: (draft, action) => {
    draft.settings.items.push(action.payload);
  },
  updateAlert: (draft, action) => {
    const index = draft.settings.items.findIndex(
      (a) => a.id === action.payload.id,
    );
    if (index !== -1) draft.settings.items[index] = action.payload;
  },
  removeAlert: (draft, action) => {
    draft.settings.items = draft.settings.items.filter(
      (a) => a.id !== action.payload,
    );
  },
  setAlertSound: (draft, action) => {
    const alert = draft.settings.items.find((a) => a.id === action.payload.id);
    if (alert) alert.sound = action.payload.sound;
  },
  setPickerFor: (draft, action) => {
    draft.pickerFor = action.payload;
  },
};

export const reducer = produce((draft: AlertsState, action: AlertsAction) => {
  const handler = actionHandlers[action.type] as any;
  if (handler) {
    handler(draft, action);
  }
});

export function createAlert(): Alert {
  return {
    id: crypto.randomUUID(),
    enabled: true,
    trigger: { type: TOKIO_EVENTS.FOLLOW, gifts: [] },
    sound: null,
    volume: 100,
  };
}
