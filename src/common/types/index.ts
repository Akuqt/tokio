export * from "./alerts";
export * from "./connector";
export * from "./events";
export * from "./music";
export * from "./server";
export * from "./store";

export type CustomGift = {
  value: number;
  label: string;
  img: string;
  coins: number;
};

type ConfigValue =
  | string
  | number
  | boolean
  | string[]
  | number[]
  | CustomGift
  | CustomGift[]
  | undefined;

export type OverlayConfigRedux = {
  [id: string]: ConfigValue;
};
