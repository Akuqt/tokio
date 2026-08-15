import { TTSAction, TTSState } from "../helper";
import styles from "../tts.module.css";

interface Props {
  protection: TTSState["settings"]["protection"];
  bannedlistTemp: string;
  dispatch: React.Dispatch<TTSAction>;
}

export function ProtectionSection({
  protection,
  bannedlistTemp,
  dispatch,
}: Props) {
  return (
    <div className={styles.section}>
      <div>
        <h2 className={styles.section_header}>Protection</h2>
        <p className={styles.section_description}>
          Set limits and word filters to prevent chat from abusing the TTS
          system.
        </p>
      </div>

      <div className={styles.protection_input_group}>
        <div>
          <label className={styles.label_title}>
            Cooldown <span className={styles.secondary_text}>(seconds)</span>
          </label>
          <input
            type="number"
            className={styles.input_style}
            value={protection.cooldown}
            onChange={(e) =>
              dispatch({
                type: "setProtectionCooldown",
                payload: Number(e.target.value),
              })
            }
          />
        </div>
        <div>
          <label className={styles.label_title}>Max Queue Length</label>
          <input
            type="number"
            className={styles.input_style}
            value={protection.queue_length}
            onChange={(e) =>
              dispatch({
                type: "setProtectionQueueLength",
                payload: Number(e.target.value),
              })
            }
          />
        </div>
      </div>

      <div>
        <label className={styles.label_title}>
          Max Comment Length{" "}
          <span className={styles.secondary_text}>(characters)</span>
        </label>
        <input
          type="number"
          className={styles.input_style}
          style={{ maxWidth: "calc(50% - 12px)" }}
          value={protection.comment_length}
          onChange={(e) =>
            dispatch({
              type: "setProtectionCommentLength",
              payload: Number(e.target.value),
            })
          }
        />
      </div>

      <div>
        <label className={styles.label_title}>
          Banned Words Filter{" "}
          <span className={styles.secondary_text}>(comma separated)</span>
        </label>
        <textarea
          placeholder="word1, word2, word3..."
          className={`${styles.input_style} ${styles.text_area_input}`}
          value={bannedlistTemp}
          onChange={(e) => {
            dispatch({
              type: "setProtectionBannedTemp",
              payload: e.target.value,
            });
            const cleanedArray = e.target.value
              .split(",")
              .map((v) => v.trim())
              .filter((v) => v !== "");

            dispatch({
              type: "setProtectionBanned",
              payload: cleanedArray,
            });
          }}
        />
      </div>
    </div>
  );
}
