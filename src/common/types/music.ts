export enum MUSIC_EVENTS {
  TRACK_CHANGE = "music:trackchange",
  PROCCESS_ENDED = "music:processended",
}

export interface MusicEventMap {
  [MUSIC_EVENTS.TRACK_CHANGE]: {
    title: string;
    artist: string;
    albumArt: string;
    isPlaying: boolean;
  } | null;
  [MUSIC_EVENTS.PROCCESS_ENDED]: void;
}
