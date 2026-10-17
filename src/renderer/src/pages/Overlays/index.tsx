import { OverlayConfig } from "@/common/schemas";
import {
  APP_EVENTS,
  APP_EVENTS_RESPONSE,
  CustomGift,
  OverlayApp,
} from "@/common/types";
import { OverlayModal, Page } from "@/components";
import { useIpcListener, useIpcRequest } from "@/hooks";
import { useState } from "react";
import { postToOverlay } from "./helper";
import { GallerySection } from "./sections/GallerySection";

export function Overlays() {
  const [overlays, setOverlays] = useState<OverlayApp[]>([]);
  const [gifts, setGifts] = useState<CustomGift[]>([]);
  // Overlay being customized, and its config once loaded
  const [configId, setConfigId] = useState<string | null>(null);
  const [config, setConfig] = useState<OverlayConfig | null>(null);

  const closeModal = () => {
    setConfigId(null);
    setConfig(null);
  };

  useIpcRequest(APP_EVENTS.GET_OVERLAYS);
  useIpcRequest(APP_EVENTS.GET_GIFTS);

  useIpcListener(APP_EVENTS_RESPONSE.GET_OVERLAYS, (res) => {
    if (res?.success) setOverlays(res.data!);
  });

  useIpcListener(APP_EVENTS_RESPONSE.GET_OVERLAY_CONFIG, (res) => {
    if (res?.success) setConfig(res.data!);
  });

  useIpcListener(APP_EVENTS_RESPONSE.GET_GIFTS, (res) => {
    if (res) setGifts(res.data);
  });

  useIpcListener(APP_EVENTS_RESPONSE.SAVE_OVERLAY_CONFIG, (res) => {
    if (!res?.success) return;
    postToOverlay(res.id!, { type: "tokio:config", data: res.data! });
    closeModal();
  });

  useIpcListener(APP_EVENTS_RESPONSE.TEST_OVERLAY, (res) => {
    if (!res) return;
    for (const payload of res.payloads) postToOverlay(res.id, payload);
    closeModal();
  });

  return (
    <>
      {configId !== null && (
        <OverlayModal
          gifts={gifts}
          config={config}
          onRequestClose={closeModal}
          onSave={(saved) => {
            window.api.emit(APP_EVENTS.SAVE_OVERLAY_CONFIG, {
              config: saved,
              gifts,
              id: configId,
            });
          }}
        />
      )}

      <Page>
        <GallerySection
          overlays={overlays}
          onTest={(id) => window.api.emit(APP_EVENTS.TEST_OVERLAY, { id })}
          onCustomize={(id) => {
            window.api.emit(APP_EVENTS.GET_OVERLAY_CONFIG, { id });
            setConfigId(id);
          }}
        />
      </Page>
    </>
  );
}
