import { Btn, Toggle } from "@/components";
import { Dispatch } from "react";
import { MdOutlineAddAlert } from "react-icons/md";
import styles from "../alerts.module.css";
import { AlertsAction, createAlert } from "../helper";

type Props = {
  simultaneous: boolean;
  queueLength: number;
  dispatch: Dispatch<AlertsAction>;
};

export function HeaderSection({ simultaneous, queueLength, dispatch }: Props) {
  return (
    <div className={styles.section}>
      <div className={styles.section_header_main_container}>
        <div className={styles.section_header_container}>
          <h2 className={styles.section_header}>Alerts</h2>
          <p className={styles.section_description}>
            Enhance your stream with custom alerts.
          </p>
        </div>
        <div className={styles.section_header_btns}>
          <Btn
            title="Add alert"
            onClick={() =>
              dispatch({ type: "addAlert", payload: createAlert() })
            }
            textColor="var(--font-primary)"
            bgColor={{
              primary: "var(--background-primary)",
              secondary: "var(--background-secondary)",
            }}
          >
            <MdOutlineAddAlert size={20} />
          </Btn>
        </div>
      </div>
      <div className={styles.settings_row}>
        <label className={styles.toggle_label}>
          <Toggle
            bgColor="var(--background-secondary)"
            checked={simultaneous}
            onChange={(e) =>
              dispatch({ type: "setSimultaneous", payload: e.target.checked })
            }
          />
          Play alerts simultaneously
        </label>
        <label className={styles.toggle_label}>
          Max queue length
          <input
            type="number"
            min={1}
            className={styles.number_input}
            value={queueLength}
            onChange={(e) =>
              dispatch({
                type: "setQueueLength",
                payload: Math.max(1, Math.floor(Number(e.target.value)) || 1),
              })
            }
          />
        </label>
      </div>
    </div>
  );
}
