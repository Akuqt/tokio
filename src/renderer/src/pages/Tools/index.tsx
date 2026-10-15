import { TestOverlay } from "@/common/schemas";
import { APP_EVENTS, APP_EVENTS_RESPONSE } from "@/common/types";
import { useEffect, useRef, useState } from "react";
import {
  TestOverlaysSection,
  TestStatus,
} from "./sections/TestOverlaysSection";
import styles from "./tools.module.css";

export function Tools() {
  const [testOverlays, setTestOverlays] = useState<TestOverlay[]>([]);
  const [statuses, setStatuses] = useState<Record<string, TestStatus>>({});
  const [serverEnabled, setServerEnabled] = useState(true);
  const isInitialMount = useRef(true);

  useEffect(() => {
    const removeGetTestOverlays = window.api.on(
      APP_EVENTS_RESPONSE.GET_TEST_OVERLAYS,
      (res) => {
        if (res?.success) {
          setTestOverlays(res.data!);
        }
      },
    );
    const removeSendTestEvents = window.api.on(
      APP_EVENTS_RESPONSE.SEND_TEST_EVENTS,
      (res) => {
        if (res) {
          setStatuses((s) => ({
            ...s,
            [res.id]: res.success ? "sent" : "no-client",
          }));
        }
      },
    );
    const removeGetSettings = window.api.on(
      APP_EVENTS_RESPONSE.GET_SETTINGS,
      (res) => {
        if (res?.success) {
          setServerEnabled(res.data!.settings.server.enabled);
        }
      },
    );

    if (isInitialMount.current) {
      isInitialMount.current = false;
      window.api.emit(APP_EVENTS.GET_TEST_OVERLAYS);
      window.api.emit(APP_EVENTS.GET_SETTINGS);
    }

    return () => {
      removeGetTestOverlays();
      removeSendTestEvents();
      removeGetSettings();
    };
  }, []);

  return (
    <div className={styles.container}>
      <TestOverlaysSection
        overlays={testOverlays}
        statuses={statuses}
        serverEnabled={serverEnabled}
        onCreate={(name) => {
          window.api.emit(APP_EVENTS.ADD_TEST_OVERLAY, { name });
        }}
        onRemove={(id) => {
          window.api.emit(APP_EVENTS.REMOVE_TEST_OVERLAY, { id });
        }}
        onTest={(id) => {
          window.api.emit(APP_EVENTS.SEND_TEST_EVENTS, { id });
        }}
      />
    </div>
  );
}
