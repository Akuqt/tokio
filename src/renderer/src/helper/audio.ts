import * as Tone from "tone";

export class AudioQueue {
  private gainNode: Tone.Gain;

  private queue: Tone.ToneAudioBuffer[] = [];
  // Use GrainPlayer instead of Player!
  private activePlayers: Tone.GrainPlayer[] = [];

  private nextPlayTime: number = 0;
  public isPlaying: boolean = false;

  private currentFilters = {
    speed: 1.0, // 0.5 to 2.0 (Tempo only)
    pitch: 1.0, // 0.5 to 2.0 (Pitch only)
    volume: 1.0, // 0.0 to 4.0
  };

  constructor() {
    this.gainNode = new Tone.Gain(1.0).toDestination();
  }

  setFilters(
    filters: Partial<{ speed: number; pitch: number; volume: number }>,
  ) {
    if (filters.volume !== undefined) {
      this.currentFilters.volume = Math.max(0, Math.min(filters.volume, 4.0));
      // Ramp smoothly to prevent popping
      this.gainNode.gain.rampTo(this.currentFilters.volume, 0.1);
    }

    if (filters.speed !== undefined) {
      this.currentFilters.speed = Math.max(0.5, Math.min(filters.speed, 2.0));
    }

    if (filters.pitch !== undefined) {
      this.currentFilters.pitch = Math.max(0.5, Math.min(filters.pitch, 2.0));
    }

    // Apply immediately to actively playing audio
    this.activePlayers.forEach((player) => {
      if (filters.speed !== undefined) {
        player.playbackRate = this.currentFilters.speed;
      }
      if (filters.pitch !== undefined) {
        // GrainPlayer uses Cents for pitch detuning (-1200 to 1200)
        player.detune = Math.log2(this.currentFilters.pitch) * 1200;
      }
    });
  }

  async enqueue(
    input: string | Uint8Array | ArrayBuffer,
    autoplay: boolean = true,
  ) {
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

      const rawBuffer = await Tone.context.decodeAudioData(audioData);
      const toneBuffer = new Tone.ToneAudioBuffer(rawBuffer);

      this.queue.push(toneBuffer);

      if (autoplay) {
        this.start();
      } else if (this.isPlaying) {
        this.scheduleNext();
      }
    } catch (error) {
      console.error("Failed to decode Tone audio:", error);
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

      // Use Tone.GrainPlayer for true independent manipulation
      const player = new Tone.GrainPlayer({
        url: buffer,
        playbackRate: this.currentFilters.speed,
        detune: Math.log2(this.currentFilters.pitch) * 1200,
        // Optional: you can tweak grainSize and overlap if the audio sounds a bit "choppy"
        grainSize: 0.1,
        overlap: 0.05,
      });

      player.connect(this.gainNode);
      player.start(this.nextPlayTime);
      this.activePlayers.push(player);

      player.onstop = () => {
        this.activePlayers = this.activePlayers.filter((p) => p !== player);
        player.dispose(); // Prevent memory leaks
      };

      // PERFECT TIMING: Because GrainPlayer handles time and pitch separately,
      // pitch NO LONGER alters duration!
      const actualDuration = buffer.duration / this.currentFilters.speed;
      this.nextPlayTime += actualDuration;
    }
  }
}
