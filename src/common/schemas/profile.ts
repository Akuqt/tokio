import { z } from "zod";

// TODO: Finish Profile schema
export const ProfileSchema = z.object({
  name: z.string().min(3),
  connector: z.object({
    username: z.string(),
  }),
  tts: z.object({
    voice: z.object({
      name: z.string(),
      lang: z.string(),
    }),
    filters: z.object({
      speed: z.number(),
      pitch: z.number(),
      volume: z.number(),
    }),
    permissions: z.object({
      all: z.boolean(),
      followers: z.boolean(),
      superfans: z.boolean(),
      moderators: z.boolean(),
      level: z.object({
        enabled: z.boolean(),
        value: z.number().min(0),
      }),
      list: z.object({
        enabled: z.boolean(),
        white: z.array(z.string()),
        black: z.array(z.string()),
      }),
    }),
    format: z.object({
      template: z.string(),
      trigger: z.object({
        mode: z.enum(["any", "dot", "slash", "custom"]),
        value: z.string(),
      }),
    }),
    protection: z.object({
      cooldown: z.number(),
      queue_length: z.number(),
      comment_length: z.number(),
      banned: z.array(z.string()),
    }),
    replacements: z.array(
      z.object({
        old: z.string(),
        new: z.string(),
      }),
    ),
  }),
});

export type Profile = z.infer<typeof ProfileSchema>;
