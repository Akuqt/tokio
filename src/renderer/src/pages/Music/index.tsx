import { APP_EVENTS, APP_EVENTS_RESPONSE } from "@/common/types";
import {
  FloatingSave,
  Page,
  PermissionsSection,
  ProtectionSection,
} from "@/components";
import {
  scopeUpdater,
  useEditableSettings,
  useIpcListener,
  useIpcRequest,
} from "@/hooks";
import { useState } from "react";
import { ControlsSection } from "./sections/ControlsSection";
import { ProviderSection } from "./sections/ProviderSection";

export function Music() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  const { draft, update, hasChanges, save } = useEditableSettings(
    "music",
    "Music",
  );

  useIpcRequest(APP_EVENTS.IS_MUSIC_CONNECTED);

  useIpcListener(APP_EVENTS_RESPONSE.MUSIC_CONNECTED, (res) => {
    setConnected(res?.success ?? false);
    setLoading(false);
  });

  return (
    <>
      <FloatingSave visible={hasChanges} onSave={save} />

      <Page>
        <ProviderSection
          provider={draft.provider}
          update={scopeUpdater(update, "provider")}
          connected={connected}
          loading={loading}
          onConnect={() => {
            setLoading(true);
            // The provider connects with what is shown, so save it first.
            save();
            if (connected) {
              window.api.emit(APP_EVENTS.DISCONNECT_MUSIC);
            } else {
              window.api.emit(APP_EVENTS.CONNECT_MUSIC, { ...draft.provider });
            }
          }}
        />

        <ControlsSection
          controls={draft.controls}
          update={scopeUpdater(update, "controls")}
        />

        <PermissionsSection
          feature="Music"
          permissions={draft.permissions}
          update={scopeUpdater(update, "permissions")}
        />

        <ProtectionSection
          feature="Music"
          protection={draft.protection}
          update={scopeUpdater(update, "protection")}
        />
      </Page>
    </>
  );
}
