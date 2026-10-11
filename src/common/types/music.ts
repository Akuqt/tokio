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
