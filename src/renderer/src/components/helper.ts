export class TTSQueue {
  private audioCtx: AudioContext | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private gainNode: GainNode | null = null;

  private queue: AudioBuffer[] = [];
  private activeSources: AudioBufferSourceNode[] = [];

  private nextPlayTime: number = 0;
  private isPlaying: boolean = false;

  // Initialize the Audio Context and routing pipeline
  init() {
    if (this.audioCtx) return;

    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    this.audioCtx = new AudioContextClass();

    this.filterNode = this.audioCtx.createBiquadFilter();
    this.gainNode = this.audioCtx.createGain();

    // Default filter config (bypassed by default)
    this.filterNode.type = "lowpass";
    this.filterNode.frequency.value = 22050;

    // Route: Source -> Filter -> Gain -> Speakers
    this.filterNode.connect(this.gainNode);
    this.gainNode.connect(this.audioCtx.destination);
  }

  setFilterConfig(config: {
    type?: BiquadFilterType;
    frequency?: number;
    Q?: number;
  }) {
    if (!this.filterNode) return;

    if (config.type) this.filterNode.type = config.type;
    if (config.frequency) this.filterNode.frequency.value = config.frequency;
    if (config.Q !== undefined) this.filterNode.Q.value = config.Q;
  }

  setVolume(value: number) {
    if (this.gainNode) {
      this.gainNode.gain.value = value;
    }
  }

  // Receive a complete TTS Uint8Array message
  async enqueue(uint8Array: Uint8Array) {
    if (!this.audioCtx) this.init();

    try {
      // Safely extract the ArrayBuffer. The slice ensures we don't accidentally
      // read outside the boundaries if the Uint8Array is a view of a larger shared buffer.
      const audioData = uint8Array.buffer.slice(
        uint8Array.byteOffset,
        uint8Array.byteOffset + uint8Array.byteLength,
      ) as ArrayBuffer;

      const buffer = await this.audioCtx!.decodeAudioData(audioData);
      this.queue.push(buffer);

      if (this.isPlaying) {
        this.scheduleNext();
      }
    } catch (error) {
      console.error("Failed to decode TTS audio:", error);
    }
  }

  start() {
    if (!this.audioCtx) this.init();

    if (this.audioCtx!.state === "suspended") {
      this.audioCtx!.resume();
    }

    this.isPlaying = true;
    this.scheduleNext();
  }

  stop() {
    this.isPlaying = false;
    this.queue = [];
    this.nextPlayTime = 0;

    this.activeSources.forEach((source) => {
      try {
        source.stop();
      } catch {}
    });
    this.activeSources = [];
  }

  private scheduleNext() {
    if (!this.isPlaying || !this.audioCtx || this.queue.length === 0) return;

    // IMPORTANT: If the queue was empty and nothing is currently playing,
    // the playhead (nextPlayTime) will be in the past.
    // We must reset it to the current time so the new TTS plays immediately.
    if (this.nextPlayTime < this.audioCtx.currentTime) {
      this.nextPlayTime = this.audioCtx.currentTime;
    }

    while (this.queue.length > 0) {
      const buffer = this.queue.shift()!;
      const source = this.audioCtx.createBufferSource();
      source.buffer = buffer;

      source.connect(this.filterNode!);
      source.start(this.nextPlayTime);
      this.activeSources.push(source);

      source.onended = () => {
        this.activeSources = this.activeSources.filter((s) => s !== source);
      };

      // Advance playhead.
      // NOTE: You can add e.g. `+ 0.2` here if you want an artificial
      // 200ms breathing pause between distinct TTS messages.
      this.nextPlayTime += buffer.duration;
    }
  }

  cleanup() {
    this.stop();
    if (this.audioCtx) {
      this.audioCtx.close();
      this.audioCtx = null;
    }
  }
}
