import { MusicAction, MusicState } from "../helper";
import styles from "../music.module.css";

interface Props {
  controls: MusicState["settings"]["constrols"];
  dispatch: React.Dispatch<MusicAction>;
}

export function ControlsSection({ controls, dispatch }: Props) {
  return (
    <div className={styles.section}>
      <div>
        <h2 className={styles.section_header}>Controls</h2>
        <p className={styles.section_description}>
          Manage the chat commands used to control music playback.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <label className={styles.check_label} style={{ width: "90px" }}>
            <input
              type="checkbox"
              className={styles.check_input}
              checked={controls.play.enabled}
              onChange={(e) =>
                dispatch({
                  type: "setPlayControlEnabled",
                  payload: e.target.checked,
                })
              }
            />
            Play
          </label>
          <input
            type="text"
            className={styles.input_style}
            value={controls.play.command || "!play"}
            style={{
              width: "200px",
              color: controls.play.enabled
                ? "var(--font-primary)"
                : "var(--font-secondary)",
            }}
            disabled={!controls.play.enabled}
            onChange={(e) =>
              dispatch({
                type: "setPlayControlCommand",
                payload: e.target.value,
              })
            }
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <label className={styles.check_label} style={{ width: "90px" }}>
            <input
              type="checkbox"
              className={styles.check_input}
              checked={controls.next.enabled}
              onChange={(e) =>
                dispatch({
                  type: "setNextControlEnabled",
                  payload: e.target.checked,
                })
              }
            />
            Next
          </label>
          <input
            type="text"
            className={styles.input_style}
            value={controls.next.command || "!next"}
            style={{
              width: "200px",
              color: controls.next.enabled
                ? "var(--font-primary)"
                : "var(--font-secondary)",
            }}
            disabled={!controls.next.enabled}
            onChange={(e) =>
              dispatch({
                type: "setNextControlCommand",
                payload: e.target.value,
              })
            }
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <label className={styles.check_label} style={{ width: "90px" }}>
            <input
              type="checkbox"
              className={styles.check_input}
              checked={controls.last.enabled}
              onChange={(e) =>
                dispatch({
                  type: "setLastControlEnabled",
                  payload: e.target.checked,
                })
              }
            />
            Last
          </label>
          <input
            type="text"
            className={styles.input_style}
            value={controls.last.command || "!last"}
            style={{
              width: "200px",
              color: controls.last.enabled
                ? "var(--font-primary)"
                : "var(--font-secondary)",
            }}
            disabled={!controls.last.enabled}
            onChange={(e) =>
              dispatch({
                type: "setLastControlCommand",
                payload: e.target.value,
              })
            }
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <label className={styles.check_label} style={{ width: "90px" }}>
            <input
              type="checkbox"
              className={styles.check_input}
              checked={controls.revoke.enabled}
              onChange={(e) =>
                dispatch({
                  type: "setRevokeControlEnabled",
                  payload: e.target.checked,
                })
              }
            />
            Revoke
          </label>
          <input
            type="text"
            className={styles.input_style}
            value={controls.revoke.command || "!revoke"}
            style={{
              width: "200px",
              color: controls.revoke.enabled
                ? "var(--font-primary)"
                : "var(--font-secondary)",
            }}
            disabled={!controls.revoke.enabled}
            onChange={(e) =>
              dispatch({
                type: "setRevokeControlCommand",
                payload: e.target.value,
              })
            }
          />
        </div>
      </div>
    </div>
  );
}
