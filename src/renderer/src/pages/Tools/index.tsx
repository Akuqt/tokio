import { TestOverlay } from "@/common/schemas";
import { APP_EVENTS, APP_EVENTS_RESPONSE } from "@/common/types";
import { Page } from "@/components";
import { useIpcListener, useIpcRequest } from "@/hooks";
import { useState } from "react";
import { TestStatus } from "./helper";
import { TestOverlaysSection } from "./sections/TestOverlaysSection";

export function Tools() {
  const [testOverlays, setTestOverlays] = useState<TestOverlay[]>([]);
  const [statuses, setStatuses] = useState<Record<string, TestStatus>>({});
  const [serverEnabled, setServerEnabled] = useState(true);

  useIpcRequest(APP_EVENTS.GET_TEST_OVERLAYS);
  useIpcRequest(APP_EVENTS.GET_SETTINGS);

  useIpcListener(APP_EVENTS_RESPONSE.GET_TEST_OVERLAYS, (res) => {
    if (res?.success) setTestOverlays(res.data!);
  });

  useIpcListener(APP_EVENTS_RESPONSE.SEND_TEST_EVENTS, (res) => {
    if (!res) return;
    setStatuses((s) => ({
      ...s,
      [res.id]: res.success ? "sent" : "no-client",
    }));
  });

  useIpcListener(APP_EVENTS_RESPONSE.GET_SETTINGS, (res) => {
    if (res?.success) setServerEnabled(res.data!.settings.server.enabled);
  });

  return (
    <Page>
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
    </Page>
  );
}
