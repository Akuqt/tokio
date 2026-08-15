import { TTSAction, TTSState } from "../helper";
import styles from "../tts.module.css";

interface Props {
  permissions: TTSState["settings"]["permissions"];
  whitelistTemp: string;
  blacklistTemp: string;
  dispatch: React.Dispatch<TTSAction>;
}

export function PermissionsSection({
  permissions,
  whitelistTemp,
  blacklistTemp,
  dispatch,
}: Props) {
  return (
    <div className={styles.section}>
      <div>
        <h2 className={styles.section_header}>Permissions</h2>
        <p className={styles.section_description}>
          Control exactly who has permission to use the TTS system.
        </p>
      </div>

      <div className={styles.check_input_container}>
        <label className={styles.check_label}>
          <input
            type="checkbox"
            checked={permissions.all}
            className={styles.check_input}
            onChange={(e) =>
              dispatch({
                type: "setPermissionsAll",
                payload: e.target.checked,
              })
            }
          />
          Allow Everyone
        </label>
        <label className={styles.check_label}>
          <input
            type="checkbox"
            checked={permissions.followers}
            className={styles.check_input}
            onChange={(e) =>
              dispatch({
                type: "setPermissionsFollowers",
                payload: e.target.checked,
              })
            }
          />
          Followers Only
        </label>

        <label className={styles.check_label}>
          <input
            type="checkbox"
            checked={permissions.superfans}
            className={styles.check_input}
            onChange={(e) =>
              dispatch({
                type: "setPermissionsSuperfans",
                payload: e.target.checked,
              })
            }
          />
          Superfans Only
        </label>
        <label className={styles.check_label}>
          <input
            type="checkbox"
            checked={permissions.moderators}
            className={styles.check_input}
            onChange={(e) =>
              dispatch({
                type: "setPermissionsModerators",
                payload: e.target.checked,
              })
            }
          />
          Moderators Only
        </label>

        <div style={{ display: "flex", alignItems: "center", height: "38px" }}>
          <label className={styles.check_label}>
            <input
              type="checkbox"
              checked={permissions.level.enabled}
              className={styles.check_input}
              onChange={(e) =>
                dispatch({
                  type: "setPermissionsLevelEnabled",
                  payload: e.target.checked,
                })
              }
            />
            Minimum Fan Level
          </label>
        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
          <input
            type="number"
            min="0"
            className={`${styles.input_style} ${styles.check_input_number}`}
            style={{
              opacity: permissions.level.enabled ? 1 : 0,
              pointerEvents: permissions.level.enabled ? "auto" : "none",
            }}
            value={permissions.level.value}
            onChange={(e) =>
              dispatch({
                type: "setPermissionsLevelValue",
                payload: Number(e.target.value),
              })
            }
            disabled={!permissions.level.enabled}
          />
        </div>
      </div>

      <div style={{ marginTop: "16px" }}>
        <label className={styles.check_label}>
          <input
            type="checkbox"
            checked={permissions.list.enabled}
            className={styles.check_input}
            onChange={(e) =>
              dispatch({
                type: "setPermissionsListEnabled",
                payload: e.target.checked,
              })
            }
          />
          Enable Whitelist / Blacklist
        </label>

        {permissions.list.enabled && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "24px",
              marginTop: "24px",
            }}
          >
            <div>
              <label className={styles.label_title}>
                Whitelist{" "}
                <span className={styles.secondary_text}>(comma separated)</span>
              </label>
              <textarea
                className={`${styles.input_style} ${styles.text_area_input}`}
                placeholder="Nickname1, Nickname2, Nickname3, ..."
                value={whitelistTemp}
                onChange={(e) => {
                  dispatch({
                    type: "setPermissionsListWhiteTemp",
                    payload: e.target.value,
                  });
                  const cleanedArray = e.target.value
                    .split(",")
                    .map((v) => v.trim())
                    .filter((v) => v !== "");

                  dispatch({
                    type: "setPermissionsListWhite",
                    payload: cleanedArray,
                  });
                }}
              />
            </div>
            <div>
              <label className={styles.label_title}>
                Blacklist{" "}
                <span className={styles.secondary_text}>(comma separated)</span>
              </label>
              <textarea
                className={`${styles.input_style} ${styles.text_area_input}`}
                placeholder="Nickname1, Nickname2, Nickname3, ..."
                value={blacklistTemp}
                onChange={(e) => {
                  dispatch({
                    type: "setPermissionsListBlackTemp",
                    payload: e.target.value,
                  });
                  const cleanedArray = e.target.value
                    .split(",")
                    .map((v) => v.trim())
                    .filter((v) => v !== "");

                  dispatch({
                    type: "setPermissionsListBlack",
                    payload: cleanedArray,
                  });
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
