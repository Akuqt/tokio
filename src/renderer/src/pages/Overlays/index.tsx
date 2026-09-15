import { OverlayConfig } from "@/common/schemas";
import {
  APP_EVENTS,
  APP_EVENTS_RESPONSE,
  CustomGift,
  OverlayApp,
  TokioPayload,
} from "@/common/types";
import { OverlayModal, OverlayView } from "@/components";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./overlays.module.css";
import { GeneralSection } from "./sections/GeneralSection";

export function Overlays() {
  const [overlayApps, setOverlayApps] = useState<OverlayApp[]>([]);
  const [overlayConfig, setOverlayConfig] = useState<OverlayConfig | null>(
    null,
  );
  const [configID, setConfigID] = useState("");
  const [gifts, setGifts] = useState<CustomGift[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      window.api.emit(APP_EVENTS.GET_OVERLAYS);
      window.api.emit(APP_EVENTS.GET_GIFTS);
    }
    const removeGetOverlayApps = window.api.on(
      APP_EVENTS_RESPONSE.GET_OVERLAYS,
      (res) => {
        if (res?.success) {
          setOverlayApps(res.data!);
        }
      },
    );
    const removeGetOverlayConfig = window.api.on(
      APP_EVENTS_RESPONSE.GET_OVERLAY_CONFIG,
      (res) => {
        if (res?.success) {
          setOverlayConfig(res.data!);
        }
      },
    );

    const removeGetGifts = window.api.on(
      APP_EVENTS_RESPONSE.GET_GIFTS,
      (res) => {
        if (res) {
          setGifts(res.data);
        }
      },
    );

    const removeSaveOverlayConfig = window.api.on(
      APP_EVENTS_RESPONSE.SAVE_OVERLAY_CONFIG,
      (res) => {
        if (res?.success) {
          overlayPostData(res.id!, {
            type: "tokio:config",
            data: res.data!,
          });
          setShowModal(false);
          setOverlayConfig(null);
        }
      },
    );

    const removeTestOverlay = window.api.on(
      APP_EVENTS_RESPONSE.TEST_OVERLAY,
      (res) => {
        if (res) {
          for (const payload of res.payloads) {
            overlayPostData(res.id, payload);
          }
          setShowModal(false);
          setOverlayConfig(null);
        }
      },
    );

    return () => {
      removeGetOverlayApps();
      removeGetOverlayConfig();
      removeGetGifts();
      removeSaveOverlayConfig();
      removeTestOverlay();
    };
  }, []);

  const overlayPostData = useCallback((id: string, payload: TokioPayload) => {
    const name = `TOKIO_APP-${id}`;

    const targetWindow = window.frames[name];

    if (targetWindow) {
      targetWindow.postMessage(
        {
          action: "TOKIO_PREVIEW",
          payload,
        },
        "*",
      );
      window.api.emit(APP_EVENTS.SEND_OVERLAY_DATA, {
        id,
        payload,
      });
    } else {
      console.warn(`Iframe ${id} not found or not loaded yet.`);
    }
  }, []);

  return (
    <>
      {showModal && (
        <OverlayModal
          gifts={gifts}
          config={overlayConfig}
          onRequestClose={() => {
            setShowModal(false);
            setOverlayConfig(null);
          }}
          onReset={() => {
            // TODO: Implement overlay settings reset
          }}
          onSave={(config) => {
            window.api.emit(APP_EVENTS.SAVE_OVERLAY_CONFIG, {
              config,
              gifts,
              id: configID,
            });
          }}
        />
      )}
      <div className={styles.container}>
        <GeneralSection
          onClick={() => {
            window.api.emit(APP_EVENTS.IMPORT_OVERLAY, {
              gifts,
            });
          }}
        />

        <span className={styles.section_delimiter} />

        {overlayApps.map((overlay, index) => (
          <OverlayView
            key={index}
            width="800px"
            height="500px"
            overlay={overlay}
            onTest={(id) => {
              window.api.emit(APP_EVENTS.TEST_OVERLAY, { id });
            }}
            onCustomize={(id) => {
              window.api.emit(APP_EVENTS.GET_OVERLAY_CONFIG, { id });
              setShowModal(true);
              setConfigID(id);
            }}
          />
        ))}
      </div>
    </>
  );
}
