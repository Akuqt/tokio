import { z } from "zod";

// TODO: Finish Profile schema
export const ProfileSchema = z.object({
  name: z.string().min(3),
  tiktok: z.object({
    username: z.string(),
  }),
  tts: z.object({
    voice: z.object({
      category: z.string(),
      name: z.string(),
    }),
  }),
});

export type Profile = z.infer<typeof ProfileSchema>;
