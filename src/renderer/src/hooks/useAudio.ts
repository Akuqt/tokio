import { AudioContext } from "@/context";
import { useContext } from "react";

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error("useAudio must be used within a AudioProvider");
  }
  return context;
};
