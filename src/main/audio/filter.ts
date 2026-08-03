import { spawn } from "node:child_process";
import { Readable } from "node:stream";

type AudioFilters = {
  speed?: number;
  pitch?: number;
  volume?: number;
};

export class AudioFilterService {
  private ffmpegPath: string;
  private args: string[];

  constructor(ffmpegPath?: string) {
    this.ffmpegPath = ffmpegPath || "";
    this.args = [];
  }

  private _setBaseArgs() {
    this.args = ["-i", "pipe:0"];
    this.args.push("-f", "mp3", "pipe:1");
  }

  private _filterAudio(
    source: string | Readable,
  ): Promise<Buffer<ArrayBuffer>> {
    if (this.args.length === 0) {
      this._setBaseArgs();
    }
    let stream: Readable;
    if (typeof source === "string") {
      stream = Readable.from(Buffer.from(source, "base64"));
    } else if (source instanceof Readable) {
      stream = source;
    } else {
      return Promise.reject(
        new Error(
          "Invalid source type. Must be a valid b64 encoded string or Readable stream.",
        ),
      );
    }
    return new Promise((resolve, reject) => {
      const ffmpegProcess = spawn(this.ffmpegPath, this.args);
      const outputChunks: Buffer[] = [];
      let errorMessage = "";
      stream.pipe(ffmpegProcess.stdin);
      ffmpegProcess.stdout.on("data", (chunk) => {
        outputChunks.push(Buffer.from(chunk));
      });
      ffmpegProcess.stderr.on("data", (data) => {
        errorMessage += data.toString();
      });
      ffmpegProcess.on("close", (code) => {
        if (code === 0) {
          const finalBuffer = Buffer.concat(outputChunks);
          resolve(finalBuffer);
        } else {
          console.error("FFmpeg Error Logs:", errorMessage);
          reject(new Error(`FFmpeg exited with code ${code}`));
        }
      });
      ffmpegProcess.on("error", (err) => {
        reject(new Error(`Failed to start FFmpeg process: ${err.message}`));
      });
    });
  }

  public setFFmpegPath(path: string) {
    this.ffmpegPath = path;
  }

  public setFilters(filters?: AudioFilters) {
    if (!filters) {
      this._setBaseArgs();
      return;
    }
    this.args = ["-i", "pipe:0"];
    const _filters: string[] = [];
    if (filters.volume && filters.volume !== 1 && filters.volume > 0) {
      _filters.push(`volume=${filters.volume}`);
    }
    const pitchMultiplier = filters.pitch || 1;
    const speedMultiplier = filters.speed || 1;
    if (pitchMultiplier !== 1 && pitchMultiplier > 0) {
      _filters.push(`asetrate=44100*${pitchMultiplier}`);
      _filters.push(`aresample=44100`);
      const combinedTempo = speedMultiplier / pitchMultiplier;
      _filters.push(`atempo=${combinedTempo}`);
    } else if (speedMultiplier !== 1 && speedMultiplier > 0) {
      _filters.push(`atempo=${speedMultiplier}`);
    }
    if (_filters.length > 0) {
      this.args.push("-af", _filters.join(","));
    }
    this.args.push("-f", "mp3", "pipe:1");
  }

  public async filterAudio(
    source: string | Readable,
    filters?: AudioFilters,
  ): Promise<Readable> {
    this.setFilters(filters);
    return Readable.from(await this._filterAudio(source));
  }

  public async filterAudioB64(
    source: string | Readable,
    filters?: AudioFilters,
  ): Promise<string> {
    this.setFilters(filters);
    return (await this._filterAudio(source)).toString("base64");
  }
}
