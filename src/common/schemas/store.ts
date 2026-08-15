import { z } from "zod";

const ProviderSchema = z.object({
  name: z.string(),
  key: z.string(),
  active: z.boolean(),
});

const EntityMetadataSchema = z.object({
  file: z.string(),
  name: z.string(),
});

const AppSettingsSchema = z.object({
  server: z.object({
    enabled: z.boolean(),
    port: z.number().min(1024).max(65535),
  }),
  theme_mode: z.enum(["dark", "light", "system"]),
  activeTheme: EntityMetadataSchema,
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
  themes: z.array(EntityMetadataSchema),
  profiles: z.array(EntityMetadataSchema),
});

export type AppProvider = z.infer<typeof ProviderSchema>;
export type EntityMetadata = z.infer<typeof EntityMetadataSchema>;
export type AppSettings = z.infer<typeof AppSettingsSchema>;
export type StoreSchema = z.infer<typeof StoreZodSchema>;
