export type InstallerStep =
  | "welcome"
  | "initializing"
  | "downloading"
  | "installing"
  | "complete"
  | "error";

type InstallerEvent = "STATE" | "NON_FOUND";

type StateValue = {
  Progress: number;
  State: "downloading" | "installing" | "complete" | "error";
  Message?: string;
};

type InstallerValue<T extends InstallerEvent> = T extends "STATE"
  ? StateValue
  : string;

type InstallerData = {
  [K in InstallerEvent]: {
    Type: K;
    Value: InstallerValue<K>;
  };
}[InstallerEvent];

export function parseData(data: string): InstallerData {
  try {
    return JSON.parse(data) as InstallerData;
  } catch {
    return {
      Type: "NON_FOUND",
      Value: "",
    };
  }
}
