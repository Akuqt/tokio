import { TTSAction, TTSState } from "../helper";
import styles from "../tts.module.css";

interface Props {
  format: TTSState["settings"]["format"];
  dispatch: React.Dispatch<TTSAction>;
}

export function FormatSection({ format, dispatch }: Props) {
  return (
    <div className={styles.section}>
      <div>
        <h2 className={styles.section_header}>Format</h2>
        <p className={styles.section_description}>
          Determine which chat messages get read aloud.
        </p>
      </div>

      <div className={styles.radio_container}>
        <label className={styles.radio_label_container}>
          <input
            type="radio"
            name="trigger"
            className={styles.radio_input}
            checked={format.trigger.mode === "any"}
            onChange={() =>
              dispatch({
                type: "setTrigger",
                payload: { mode: "any", value: "" },
              })
            }
          />
          <div className={styles.radio_text_container}>
            <span className={styles.radio_text_title}>Read All Comments</span>
            <span className={styles.radio_text_description}>
              Every single message in chat will be processed by TTS.
            </span>
          </div>
        </label>

        <label className={styles.radio_label_container}>
          <input
            type="radio"
            name="trigger"
            className={styles.radio_input}
            checked={format.trigger.mode === "dot"}
            onChange={() =>
              dispatch({
                type: "setTrigger",
                payload: { mode: "dot", value: "." },
              })
            }
          />
          <div className={styles.radio_text_container}>
            <span className={styles.radio_text_title}>Dot Prefix ( . )</span>
            <span className={styles.radio_text_description}>
              Only messages starting with a period will be read.
            </span>
          </div>
        </label>

        <label className={styles.radio_label_container}>
          <input
            type="radio"
            name="trigger"
            className={styles.radio_input}
            checked={format.trigger.mode === "slash"}
            onChange={() =>
              dispatch({
                type: "setTrigger",
                payload: { mode: "slash", value: "/" },
              })
            }
          />
          <div className={styles.radio_text_container}>
            <span className={styles.radio_text_title}>Slash Prefix ( / )</span>
            <span className={styles.radio_text_description}>
              Only messages starting with a forward slash will be read.
            </span>
          </div>
        </label>

        <label className={styles.radio_label_container}>
          <input
            type="radio"
            name="trigger"
            className={styles.radio_input}
            checked={format.trigger.mode === "custom"}
            onChange={() =>
              dispatch({
                type: "setTrigger",
                payload: { mode: "custom", value: "" },
              })
            }
          />
          <div className={styles.radio_text_container}>
            <span className={styles.radio_text_title_custom}>
              Custom Command
              <input
                type="text"
                value={
                  format.trigger.mode === "custom" ? format.trigger.value : ""
                }
                disabled={format.trigger.mode !== "custom"}
                placeholder="!tts"
                onChange={(e) => {
                  if (format.trigger.mode === "custom")
                    dispatch({
                      type: "setTrigger",
                      payload: {
                        mode: "custom",
                        value: e.target.value,
                      },
                    });
                }}
                className={`${styles.input_style} ${styles.input_trigger}`}
              />
            </span>
            <span className={styles.radio_text_description}>
              Only messages starting with this exact phrase will be read.
            </span>
          </div>
        </label>
      </div>

      <div style={{ marginTop: "8px" }}>
        <label className={styles.label_title}>Message Template</label>
        <input
          type="text"
          className={styles.input_style}
          value={format.template}
          onChange={(e) =>
            dispatch({ type: "setTemplate", payload: e.target.value })
          }
        />
        <p className={styles.template_description}>
          Variables: {"{username}"}, {"{nickname}"}, {"{comment}"}
        </p>
      </div>
    </div>
  );
}
