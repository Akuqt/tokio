import { OverlayMetadata } from "../schemas/store";

export type OverlayApp = OverlayMetadata & { path: string; id: string };
