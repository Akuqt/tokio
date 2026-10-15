import { AudioContext, AudioContextType } from "@/context/audio";
import { useContext } from "react";

export function useAudio(): AudioContextType {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error("useAudio must be used within a AudioProvider");
  }
  return context;
}
