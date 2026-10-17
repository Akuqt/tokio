// Where the app is in finding and installing a new release.
export type UpdateStatus =
  | { state: "idle" }
  // Not packaged, or a Linux build that isn't an AppImage
  | { state: "unsupported" }
  | { state: "checking" }
  | { state: "none"; checkedAt: number }
  // manual: the update can't be installed by the app (macOS), `url` is the
  // release page to download it from
  | { state: "available"; version: string; manual: boolean; url: string }
  | { state: "downloading"; version: string; percent: number }
  | { state: "ready"; version: string };
