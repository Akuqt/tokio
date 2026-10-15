import { AudioQueue } from "@/helper";
import React, { createContext, useRef } from "react";
import * as Tone from "tone";

export interface AudioContextType {
  getQueue: (name: string) => AudioQueue;
  stopQueues: (prefix: string) => void;
  setItemGain: (key: string, gain: number) => void;
  resumeContext: () => Promise<void>;
}

export const AudioContext = createContext<AudioContextType | null>(null);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const queuesRef = useRef<Map<string, AudioQueue>>(new Map());

  const getQueue = (name: string) => {
    if (!queuesRef.current.has(name)) {
      queuesRef.current.set(name, new AudioQueue());
    }
    return queuesRef.current.get(name)!;
  };

  const stopQueues = (prefix: string) => {
    queuesRef.current.forEach((queue, name) => {
      if (name.startsWith(prefix)) queue.stop();
    });
  };

  const setItemGain = (key: string, gain: number) => {
    queuesRef.current.forEach((queue) => queue.setItemGain(key, gain));
  };

  const resumeContext = async () => {
    if (Tone.getContext().state !== "running") {
      await Tone.start();
    }
  };

  return (
    <AudioContext.Provider
      value={{ getQueue, stopQueues, setItemGain, resumeContext }}
    >
      {children}
    </AudioContext.Provider>
  );
};
