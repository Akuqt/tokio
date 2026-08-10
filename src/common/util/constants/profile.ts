import { Profile } from "../../schemas";

export const defaultProfile: Profile = {
  name: "Default",
  connector: {
    username: "",
  },
  tts: {
    voice: {
      lang: "en",
      name: "Default",
    },
    filters: {
      pitch: 1,
      speed: 1,
      volume: 100,
    },
    permissions: {
      all: true,
      followers: false,
      superfans: false,
      moderators: false,
      level: {
        enabled: false,
        value: 0,
      },
      list: {
        enabled: false,
        white: [],
        black: [],
      },
    },
    format: {
      template: "{username} {comment}",
      trigger: {
        mode: "any",
        value: "",
      },
    },
    protection: {
      comment_length: 300,
      cooldown: 2,
      banned: [],
      queue_length: 5,
    },
    replacements: [],
  },
};
