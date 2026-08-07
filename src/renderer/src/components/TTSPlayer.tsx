import React, { useEffect, useRef, useState } from "react";
import { TTSQueue } from "./helper";

interface TTSPlayerProps {
  incomingTTS?: Uint8Array | null;
}

const TTSPlayer: React.FC<TTSPlayerProps> = ({ incomingTTS }) => {
  const ttsManager = useRef<TTSQueue | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    ttsManager.current = new TTSQueue();

    return () => {
      ttsManager.current?.cleanup();
    };
  }, []);

  // Listen for new TTS messages
  useEffect(() => {
    if (incomingTTS && ttsManager.current) {
      ttsManager.current.enqueue(incomingTTS);
    }
  }, [incomingTTS]);

  const handleStart = () => {
    if (!ttsManager.current) return;
    ttsManager.current.start();
    setIsPlaying(true);
  };

  const handleStop = () => {
    if (!ttsManager.current) return;
    ttsManager.current.stop();
    setIsPlaying(false);
  };

  const applyRadioFilter = () => {
    ttsManager.current?.setFilterConfig({
      type: "bandpass",
      frequency: 1500, // Makes TTS sound like it's over a walkie-talkie
      Q: 2.0,
    });
  };

  const clearFilter = () => {
    ttsManager.current?.setFilterConfig({
      type: "lowpass",
      frequency: 22050,
    });
  };

  return (
    <div
      style={{ padding: "20px", border: "1px solid #ccc", borderRadius: "8px" }}
    >
      <h3>Electron TTS Queue</h3>

      <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
        <button onClick={handleStart} disabled={isPlaying}>
          ▶ Start / Unmute
        </button>
        <button onClick={handleStop} disabled={!isPlaying}>
          ■ Stop / Clear Queue
        </button>
      </div>

      <div style={{ display: "flex", gap: "10px" }}>
        <button onClick={applyRadioFilter}>📻 Radio Filter</button>
        <button onClick={clearFilter}>🎙️ Clear Audio</button>
      </div>
    </div>
  );
};

export default TTSPlayer;
