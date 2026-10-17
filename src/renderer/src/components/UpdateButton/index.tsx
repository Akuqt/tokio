import { APP_EVENTS, UpdateStatus } from "@/common/types";
import { useState } from "react";
import { createPortal } from "react-dom";
import { FiDownload, FiRefreshCw } from "react-icons/fi";
import { Btn } from "../Elements";
import { Modal } from "../Modal";
import styles from "./updatebutton.module.css";

type Props = {
  status: UpdateStatus;
  // Restarting ends the LIVE connection, so it asks first
  connected: boolean;
};

/**
 * Title bar button shown once an update is downloaded, or on macOS once one
 * can be downloaded from the release page.
 */
export function UpdateButton({ status, connected }: Props) {
  const [confirm, setConfirm] = useState(false);

  const ready = status.state === "ready";
  const manual = status.state === "available" && status.manual;
  if (!ready && !manual) return null;

  const install = () => window.api.emit(APP_EVENTS.INSTALL_UPDATE);

  return (
    <div className={styles.container}>
      {confirm &&
        createPortal(
          <Modal
            title="Restart to update?"
            description="Tokio will disconnect from the LIVE. TTS, music requests and alerts stop until you connect again."
            confirmText="Restart"
            onClose={() => setConfirm(false)}
            onConfirm={() => {
              setConfirm(false);
              install();
            }}
          />,
          document.body,
        )}

      <Btn
        variant="accent"
        title={`Tokio ${status.version}`}
        className={styles.button}
        onClick={() => (ready && connected ? setConfirm(true) : install())}
      >
        {ready ? <FiRefreshCw size={14} /> : <FiDownload size={14} />}
        {ready ? "Restart to update" : "Download update"}
      </Btn>
    </div>
  );
}
