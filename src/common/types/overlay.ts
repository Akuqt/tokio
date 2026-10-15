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
