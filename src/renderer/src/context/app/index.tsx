import { APP_EVENTS, APP_EVENTS_RESPONSE } from "@/common/types";
import { useAudio } from "@/hooks/useAudio";
import { useIpcListener } from "@/hooks/useIpcListener";
import { useIpcRequest } from "@/hooks/useIpcRequest";
import { SplashScreen } from "@/splash";
import React, { useState } from "react";

/**
 * Shows the splash screen until main has loaded, and plays the audio main
 * sends for TTS and alerts on any page.
 */
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [appLoading, setAppLoading] = useState(true);

  const { getQueue, stopQueues } = useAudio();

  useIpcRequest(APP_EVENTS.LOAD_APP);

  useIpcListener(APP_EVENTS_RESPONSE.LOAD_APP, () => setAppLoading(false));

  useIpcListener(APP_EVENTS_RESPONSE.TTS_AUDIO, (res) => {
    if (!res) return;
    const queue = getQueue("tts_data");
    queue.setQueueOptions(res.queueOptions);
    queue.setFilters({ ...res.filters, volume: res.filters.volume / 100 });
    queue.enqueue(res.data, true);
  });

  useIpcListener(APP_EVENTS_RESPONSE.ALERT_AUDIO, (res) => {
    if (!res) return;
    const queue = getQueue(res.channel);
    queue.setQueueOptions({ maxQueueLength: res.maxQueueLength, gapTime: 0.2 });
    queue.enqueue(res.data, true, { gain: res.volume / 100, key: res.id });
  });

  useIpcListener(APP_EVENTS_RESPONSE.ALERT_CLEAR, () => stopQueues("alerts"));

  return appLoading ? <SplashScreen /> : children;
}
