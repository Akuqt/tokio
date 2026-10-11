import { z } from "zod";

const Permissions = z.object({
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
});

const MusicControl = z.object({
  enabled: z.boolean(),
  command: z.string(),
});

// TODO: Finish Profile schema
export const ProfileSchema = z.object({
  name: z.string().min(3),
  connector: z.object({
    username: z.string(),
  }),
  music: z.object({
    permissions: Permissions,
    protection: z.object({
      cooldown: z.number(),
      queue_length: z.number(),
    }),
    constrols: z.object({
      play: MusicControl,
      next: MusicControl,
      last: MusicControl,
      revoke: MusicControl,
    }),
    provider: z.object({
      name: z.enum(["YouTube", "Spotify"]),
      key: z.string(),
    }),
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
    permissions: Permissions,
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
