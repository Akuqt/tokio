import * as Tone from "tone";

interface AudioQueueOptions {
  maxQueueLength?: number;
  gapTime?: number;
}

export class AudioQueue {
  private gainNode: Tone.Gain;
  private queue: Tone.ToneAudioBuffer[] = [];
  private activePlayers: Tone.GrainPlayer[] = [];
  private nextPlayTime: number = 0;
  public isPlaying: boolean = false;
  private maxQueueLength: number;
  private gapTime: number;

  private currentFilters = {
    speed: 1.0,
    pitch: 1.0,
    volume: 1.0,
  };

  constructor() {
    this.gainNode = new Tone.Gain(1.0).toDestination();
    this.maxQueueLength = Infinity;
    this.gapTime = 0;
  }

  setFilters(
    filters: Partial<{ speed: number; pitch: number; volume: number }>,
  ) {
    if (filters.volume !== undefined) {
      this.currentFilters.volume = Math.max(0, Math.min(filters.volume, 4.0));
      this.gainNode.gain.rampTo(this.currentFilters.volume, 0.1);
    }

    if (filters.speed !== undefined) {
      this.currentFilters.speed = Math.max(0.5, Math.min(filters.speed, 2.0));
    }

    if (filters.pitch !== undefined) {
      this.currentFilters.pitch = Math.max(0.5, Math.min(filters.pitch, 2.0));
    }

    this.activePlayers.forEach((player) => {
      if (filters.speed !== undefined) {
        player.playbackRate = this.currentFilters.speed;
      }
      if (filters.pitch !== undefined) {
        player.detune = Math.log2(this.currentFilters.pitch) * 1200;
      }
    });
  }

  public setQueueOptions(options: AudioQueueOptions) {
    this.maxQueueLength = options.maxQueueLength ?? Infinity;
    this.gapTime = options.gapTime ?? 0;
  }

  async enqueue(
    input: string | Uint8Array | ArrayBuffer,
    autoplay: boolean = true,
  ) {
    if (this.queue.length >= this.maxQueueLength) {
      console.warn("AudioQueue: Max queue length reached. Ignoring input.");
      return false;
    }

    try {
      let audioData: ArrayBuffer;

      if (typeof input === "string") {
        const response = await fetch(input);
        audioData = await response.arrayBuffer();
      } else if (input instanceof Uint8Array) {
        audioData = input.buffer.slice(
          input.byteOffset,
          input.byteOffset + input.byteLength,
        ) as ArrayBuffer;
      } else {
        audioData = input;
      }

      const rawBuffer = await Tone.getContext().decodeAudioData(audioData);
      const toneBuffer = new Tone.ToneAudioBuffer(rawBuffer);

      if (this.queue.length >= this.maxQueueLength) {
        console.warn(
          "AudioQueue: Queue filled up while downloading. Dropping audio.",
        );
        return false;
      }

      this.queue.push(toneBuffer);

      if (autoplay) {
        this.start();
      } else if (this.isPlaying) {
        this.scheduleNext();
      }

      return true;
    } catch (error) {
      console.error("Failed to decode Tone audio:", error);
      return false;
    }
  }

  start() {
    this.isPlaying = true;
    this.scheduleNext();
  }

  stop() {
    this.isPlaying = false;
    this.queue = [];
    this.nextPlayTime = 0;

    this.activePlayers.forEach((player) => {
      try {
        player.stop();
        player.dispose();
      } catch {}
    });
    this.activePlayers = [];
  }

  private scheduleNext() {
    if (!this.isPlaying || this.queue.length === 0) return;

    if (this.nextPlayTime < Tone.now()) {
      this.nextPlayTime = Tone.now();
    }

    while (this.queue.length > 0) {
      const buffer = this.queue.shift()!;

      const player = new Tone.GrainPlayer({
        url: buffer,
        playbackRate: this.currentFilters.speed,
        detune: Math.log2(this.currentFilters.pitch) * 1200,
        grainSize: 0.1,
        overlap: 0.05,
      });

      player.connect(this.gainNode);
      player.start(this.nextPlayTime);
      this.activePlayers.push(player);

      player.onstop = () => {
        this.activePlayers = this.activePlayers.filter((p) => p !== player);
        player.dispose();
      };

      const actualDuration = buffer.duration / this.currentFilters.speed;

      this.nextPlayTime += actualDuration + this.gapTime;
    }
  }
}
