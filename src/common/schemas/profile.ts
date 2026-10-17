import { z } from "zod";
import { TOKIO_EVENTS } from "../types/connector";

const PermissionsSchema = z.object({
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

// Every live event (AppEvents) can trigger an alert.
const AlertTriggerSchema = z
  .enum(TOKIO_EVENTS)
  .exclude(["CONNECTED", "DISCONNECTED", "MUSIC_PROCCESS_ENDED"]);

export const ALERT_TRIGGERS = AlertTriggerSchema.options;

// file is a basename inside the sounds folder
export const AlertSoundSchema = z.object({
  name: z.string(),
  file: z.string(),
});

const AlertSchema = z.object({
  id: z.string(),
  enabled: z.boolean(),
  trigger: z.object({
    type: AlertTriggerSchema,
    // Only used by gift alerts. Empty means any gift.
    gifts: z.array(z.number()),
  }),
  sound: AlertSoundSchema.nullable(),
  volume: z.number().min(0).max(100),
});

// TODO: Finish Profile schema
export const ProfileSchema = z.object({
  name: z.string().min(3),
  connector: z.object({
    username: z.string(),
  }),
  music: z.object({
    permissions: PermissionsSchema,
    protection: z.object({
      cooldown: z.number(),
      queue_length: z.number(),
    }),
    controls: z.object({
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
      // Empty for voices saved before the engines were combined, they keep
      // the provider that was selected in Settings then.
      engine: z.string().default(""),
      name: z.string(),
      lang: z.string(),
    }),
    filters: z.object({
      speed: z.number(),
      pitch: z.number(),
      volume: z.number(),
    }),
    permissions: PermissionsSchema,
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
  // Defaults keep profiles saved before alerts existed valid.
  alerts: z
    .object({
      simultaneous: z.boolean().default(false),
      // Max sounds waiting per queue
      queue_length: z.number().min(1).default(100),
      items: z.array(AlertSchema).default([]),
    })
    .default({ simultaneous: false, queue_length: 100, items: [] }),
});

export type Profile = z.infer<typeof ProfileSchema>;
export type Permissions = z.infer<typeof PermissionsSchema>;
export type Alert = z.infer<typeof AlertSchema>;
export type AlertSound = z.infer<typeof AlertSoundSchema>;
