import { z } from "zod";

export const ProviderSchema = z.object({
  name: z.string(),
  key: z.string(),
});

export const EntityMetadataSchema = z.object({
  file: z.string(),
  name: z.string(),
});

export const AppSettingsSchema = z.object({
  server: z.object({
    enabled: z.boolean(),
    port: z.number().min(1024).max(65535),
  }),
  appearance: z.object({
    mode: z.enum(["dark", "light", "system"]),
    activeThemeFile: z.string(),
  }),
  activeProfileFile: z.string(),
  providers: z.object({
    tts: ProviderSchema,
    connector: ProviderSchema,
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
