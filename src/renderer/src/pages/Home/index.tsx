import { APP_EVENTS, APP_EVENTS_RESPONSE } from "@/common/types";
import { defaultProfile, defaultStoreData } from "@/common/util";
import { Page } from "@/components";
import { useImmerState, useIpcListener, useIpcRequest } from "@/hooks";
import { useState } from "react";
import { ConnectSection } from "./sections/ConnectSection";
import { FeaturesSection } from "./sections/FeaturesSection";
import { StatsSection } from "./sections/StatsSection";

export function Home() {
  const [username, setUsername] = useState(defaultProfile.connector.username);
  const [features, updateFeatures, setFeatures] = useImmerState(
    defaultStoreData.settings.activeFeatures,
  );
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [likes, setLikes] = useState(0);
  const [views, setViews] = useState({ current: 0, total: 0 });

  useIpcRequest(APP_EVENTS.GET_PROFILE);
  useIpcRequest(APP_EVENTS.GET_SETTINGS);
  useIpcRequest(APP_EVENTS.IS_CONNECTED);

  useIpcListener(APP_EVENTS_RESPONSE.GET_PROFILE, (res) => {
    if (res?.success) setUsername(res.profile!.connector.username);
  });

  useIpcListener(APP_EVENTS_RESPONSE.GET_SETTINGS, (res) => {
    if (res?.success) setFeatures(res.data!.settings.activeFeatures);
  });

  useIpcListener(APP_EVENTS_RESPONSE.CONNECTED, (res) => {
    if (!res) return;
    setConnected(res.success);
    setLikes(res.stats.likes);
    setViews({ current: res.stats.viewers, total: res.stats.views });
    setLoading(false);
  });

  useIpcListener(APP_EVENTS_RESPONSE.VIEWS, (res) => {
    if (res?.data) {
      setViews({ current: res.data.viewers, total: res.data.views });
    }
  });

  useIpcListener(APP_EVENTS_RESPONSE.LIKES, (res) => {
    if (res?.likes) setLikes(res.likes);
  });

  return (
    <Page>
      <ConnectSection
        username={username}
        connected={connected}
        loading={loading}
        onUsernameChange={setUsername}
        onConnect={() => {
          if (!username.replace("@", "").trim()) return;
          setLoading(true);
          window.api.emit(APP_EVENTS.CONNECT, { username });
        }}
        onDisconnect={() => {
          setLoading(true);
          window.api.emit(APP_EVENTS.DISCONNECT);
        }}
      />

      <FeaturesSection
        features={features}
        onChange={(feature, enabled) => {
          window.api.emit(APP_EVENTS.ACTIVE_FEATURES, { [feature]: enabled });
          updateFeatures((f) => {
            f[feature] = enabled;
          });
        }}
      />

      <StatsSection
        connected={connected}
        stats={[
          { label: "Viewers", value: views.current },
          { label: "Likes", value: likes },
          { label: "Total Views", value: views.total },
        ]}
      />
    </Page>
  );
}
