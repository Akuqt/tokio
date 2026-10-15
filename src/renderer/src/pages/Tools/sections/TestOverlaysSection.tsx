import { TestOverlay } from "@/common/schemas";
import { getOverlaySocketURL } from "@/common/util";
import { Btn, Input } from "@/components";
import copy from "copy-to-clipboard";
import { useState } from "react";
import { FaRegCopy } from "react-icons/fa";
import { FiTrash2 } from "react-icons/fi";
import { LuPlus } from "react-icons/lu";
import { PiShootingStarThin } from "react-icons/pi";
import { VscPlug } from "react-icons/vsc";
import styles from "../tools.module.css";

export type TestStatus = "sent" | "no-client";

interface Props {
  overlays: TestOverlay[];
  statuses: Record<string, TestStatus>;
  serverEnabled: boolean;
  onCreate: (name: string) => void;
  onRemove: (id: string) => void;
  onTest: (id: string) => void;
}

const STATUS_LABELS: Record<TestStatus, string> = {
  sent: "Test events sent.",
  "no-client": "No overlay connected with this ID.",
};

export function TestOverlaysSection({
  overlays,
  statuses,
  serverEnabled,
  onCreate,
  onRemove,
  onTest,
}: Props) {
  const [name, setName] = useState("");

  return (
    <div className={styles.section}>
      <div className={styles.section_header_container}>
        <h2 className={styles.section_header}>Test Overlays</h2>
        <p className={styles.section_description}>
          Create an ID for an overlay you are developing and send it test events
          without importing it. The overlay connects to the WebSocket with its
          ID.
        </p>
      </div>

      {!serverEnabled && (
        <p className={styles.notice}>
          The overlay server is off. Enable it in Settings to send test events.
        </p>
      )}

      <form
        className={styles.create_row}
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          onCreate(name);
          setName("");
        }}
      >
        <Input
          placeholder="Overlay name"
          textColor="var(--font-primary)"
          bgColor={{
            primary: "var(--background-primary)",
            secondary: "var(--background-secondary)",
          }}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Btn
          type="submit"
          disabled={!name.trim()}
          title="Create ID"
          textColor="var(--font-primary)"
          bgColor={{
            primary: "var(--background-primary)",
            secondary: "var(--background-secondary)",
          }}
        >
          <LuPlus size={20} />
        </Btn>
      </form>

      {overlays.length > 0 ? (
        <div className={styles.list}>
          {overlays.map((overlay) => (
            <div key={overlay.id} className={styles.item}>
              <div className={styles.item_header}>
                <h3 className={styles.item_name}>{overlay.name}</h3>
                <div className={styles.button_group}>
                  <button
                    className={styles.action_btn}
                    onClick={() => onTest(overlay.id)}
                  >
                    <PiShootingStarThin size={20} />
                    Test
                  </button>
                  <button
                    className={styles.action_btn}
                    title="Delete"
                    onClick={() => onRemove(overlay.id)}
                  >
                    <FiTrash2 size={18} />
                  </button>
                </div>
              </div>

              <div className={styles.button_group}>
                <input
                  className={styles.input_style}
                  disabled
                  value={overlay.id}
                />
                <button
                  className={styles.action_btn}
                  title="Copy ID"
                  onClick={() => copy(overlay.id)}
                >
                  <FaRegCopy size={18} />
                </button>
                <button
                  className={styles.action_btn}
                  title="Copy WebSocket URL"
                  onClick={() => copy(getOverlaySocketURL(overlay.id))}
                >
                  <VscPlug size={18} />
                </button>
              </div>

              {statuses[overlay.id] && (
                <p className={styles.status}>
                  {STATUS_LABELS[statuses[overlay.id]]}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className={styles.not_found}>No test overlays yet.</p>
      )}
    </div>
  );
}
