import { z } from "zod";
import { AlertSoundSchema } from "./profile";

const ProviderSchema = z.object({
  name: z.string(),
  key: z.string(),
  active: z.boolean(),
});

const EntityMetadataSchema = z.object({
  file: z.string(),
  name: z.string(),
});

const OverlayMeta = {
  name: z.string(),
  version: z.string(),
  external: z.boolean().optional(),
  config: z.boolean(),
};

export const OverlayMetaSchema = z.object(OverlayMeta);

const AppSettingsSchema = z.object({
  server: z.object({
    enabled: z.boolean(),
  }),
  overlays: z.array(z.object({ ...OverlayMeta, id: z.string() })),
  // Uploaded sounds, available to alerts in every profile
  sounds: z.array(AlertSoundSchema).default([]),
  activeFeatures: z.object({
    tts: z.boolean(),
    music: z.boolean(),
    alerts: z.boolean(),
  }),
  liveStats: z.object({
    likes: z.number(),
    views: z.number(),
    viewers: z.number(),
  }),
  activeProfile: EntityMetadataSchema,
  activeTTSProvider: ProviderSchema,
  activeConnProvider: ProviderSchema,
  providers: z.object({
    tts: z.array(ProviderSchema),
    connector: z.array(ProviderSchema),
  }),
});

export const StoreZodSchema = z.object({
  settings: AppSettingsSchema,
  profiles: z.array(EntityMetadataSchema),
});

export type AppProvider = z.infer<typeof ProviderSchema>;
export type EntityMetadata = z.infer<typeof EntityMetadataSchema>;
export type OverlayMetadata = z.infer<typeof OverlayMetaSchema>;
export type AppSettings = z.infer<typeof AppSettingsSchema>;
export type StoreSchema = z.infer<typeof StoreZodSchema>;
