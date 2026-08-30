import { MusicAction, MusicState } from "../helper";
import styles from "../music.module.css";

interface Props {
  protection: MusicState["settings"]["protection"];
  dispatch: React.Dispatch<MusicAction>;
}

export function ProtectionSection({ protection, dispatch }: Props) {
  return (
    <div className={styles.section}>
      <div>
        <h2 className={styles.section_header}>Protection</h2>
        <p className={styles.section_description}>
          Set limits and word filters to prevent chat from abusing the Music
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
    </div>
  );
}
