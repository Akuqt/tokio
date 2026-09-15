import { OverlayMetadata } from "../schemas";

export type OverlayApp = OverlayMetadata & { path: string; id: string };
