import styles from "../music.module.css";

export function ControlsSection() {
  return (
    <div className={styles.section}>
      <div>
        <h2 className={styles.section_header}>Controls</h2>
        <p className={styles.section_description}>
          Manage the chat commands used to control music playback.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Play Control */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <label className={styles.check_label} style={{ width: "90px" }}>
            <input
              type="checkbox"
              className={styles.check_input}
              defaultChecked
            />
            Play
          </label>
          <input
            type="text"
            className={styles.input_style}
            defaultValue="!play"
            style={{ width: "200px" }}
          />
        </div>

        {/* Next Control */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <label className={styles.check_label} style={{ width: "90px" }}>
            <input
              type="checkbox"
              className={styles.check_input}
              defaultChecked
            />
            Next
          </label>
          <input
            type="text"
            className={styles.input_style}
            defaultValue="!next"
            style={{ width: "200px" }}
          />
        </div>

        {/* Last Control */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <label className={styles.check_label} style={{ width: "90px" }}>
            <input
              type="checkbox"
              className={styles.check_input}
              defaultChecked
            />
            Last
          </label>
          <input
            type="text"
            className={styles.input_style}
            defaultValue="!last"
            style={{ width: "200px" }}
          />
        </div>
      </div>
    </div>
  );
}
