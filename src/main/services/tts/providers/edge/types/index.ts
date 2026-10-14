// Token versions with a generator in common/drm.ts.
export type TokenVersion = "1" | "2";

export type EdgeStage =
  "voices" | "handshake" | "synthesis" | "no-audio" | "timeout" | "network";

// Fields we use from the voice list response, see README.md.
export type EdgeVoice = {
  Name: string;
  ShortName: string;
  Gender: string;
  Locale: string;
  FriendlyName: string;
  Status: string;
};

export type EdgeConfig = {
  TRUSTED_CLIENT_TOKEN: string;
  WSS_URL: string;
  VOICE_LIST_URL: string;
  CHROMIUM_FULL_VERSION: string;
  TOKEN_VERSIONS: TokenVersion[];
  ORIGIN: string;
  OUTPUT_FORMAT: string;
  DEFAULT_VOICE: { lang: string; name: string };
  MAX_CHUNK_BYTES: number;
  REQUEST_TIMEOUT_MS: number;
  VOICES_TTL_MS: number;
};

export type EdgeConfigOverrides = Partial<
  Pick<EdgeConfig, "CHROMIUM_FULL_VERSION" | "TOKEN_VERSIONS">
>;
