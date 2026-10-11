export enum MUSIC_EVENTS {
  TRACK_CHANGE = "music:trackchange",
  PROCCESS_ENDED = "music:processended",
}

export interface MusicEventMap {
  [MUSIC_EVENTS.TRACK_CHANGE]: SongInfo | null;
  [MUSIC_EVENTS.PROCCESS_ENDED]: void;
}

export type SongInfo = {
  album: string;
  track: string;
  title: string;
  thumbnail: string;
  duration: number;
};

export type CurrentSongInfo = {
  time: number;
  playing: boolean;
} & SongInfo;
