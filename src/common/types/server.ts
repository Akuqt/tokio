export type WSRoom =
  | "GLOBAL"
  | "CHAT"
  | "SHARE"
  | "FOLLOW"
  | "GIFT"
  | "LIKE"
  | "ENVELOPE"
  | "SUPER_FAN"
  | "SUPER_FAN_BOX"
  | "SUPER_FAN_JOIN"
  | "MEMBER_JOIN";

export interface OverlayApp {
  name: string;
  id: `${string}-${string}-${string}-${string}`;
  path: string;
  category: WSRoom;
  route: string;
}
