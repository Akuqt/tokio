import { Alert, ALERT_TRIGGERS } from "@/common/schemas";
import { ALERT_TRIGGER_LABELS, CustomGift, TOKIO_EVENTS } from "@/common/types";
import { Btn, Select, Slider, Toggle } from "../Elements";
import { AlertTestRequest } from "@renderer/hooks";
import { FiPlayCircle, FiStopCircle, FiTrash2 } from "react-icons/fi";
import styles from "./alertitem.module.css";

const TRIGGER_OPTIONS = ALERT_TRIGGERS.map((value) => ({
  value,
  label: ALERT_TRIGGER_LABELS[value],
}));

type Props = {
  alert: Alert;
  gifts: CustomGift[];
  // This alert's sound is loading or playing
  testing: boolean;
  onTest: (req: AlertTestRequest) => void;
  onChange: (alert: Alert) => void;
  onRemove: () => void;
  onPickSound: () => void;
};

export function AlertItem({
  alert,
  gifts,
  testing,
  onTest,
  onChange,
  onRemove,
  onPickSound,
}: Props) {
  const { sound } = alert;

  return (
    <div className={styles.alerts_row}>
      <div className={styles.column_item}>
        <button
          className={`${styles.action_btn} ${testing ? styles.playing : ""}`}
          title={testing ? "Stop" : "Play"}
          disabled={!sound}
          onClick={() => {
            if (!sound) return;
            onTest({ id: alert.id, file: sound.file, volume: alert.volume });
          }}
        >
          {testing ? <FiStopCircle size={24} /> : <FiPlayCircle size={24} />}
        </button>
        <button className={styles.action_btn} title="Remove" onClick={onRemove}>
          <FiTrash2 size={24} />
        </button>
      </div>

      <div className={styles.column_item}>
        <Toggle
          bgColor="var(--background-secondary)"
          checked={alert.enabled}
          onChange={(e) => onChange({ ...alert, enabled: e.target.checked })}
        />
      </div>

      <div className={styles.column_item}>
        <Select
          bgColor={{
            active: "var(--background-primary)",
            passive: "var(--background-secondary)",
          }}
          labelColor={{
            active: "var(--font-primary)",
            passive: "var(--font-secondary)",
          }}
          placeholder="Select a trigger..."
          onChange={(val) => {
            const type = ALERT_TRIGGERS.find((t) => t === val);
            if (type)
              onChange({ ...alert, trigger: { ...alert.trigger, type } });
          }}
          options={TRIGGER_OPTIONS}
          value={alert.trigger.type}
        />
      </div>

      {alert.trigger.type === TOKIO_EVENTS.GIFT ? (
        <div className={styles.column_item}>
          <Select
            searchable
            multiple
            placeholder="Any gift"
            bgColor={{
              active: "var(--background-primary)",
              passive: "var(--background-secondary)",
            }}
            labelColor={{
              active: "var(--font-primary)",
              passive: "var(--font-secondary)",
            }}
            value={alert.trigger.gifts}
            onChange={(val) =>
              onChange({
                ...alert,
                trigger: { ...alert.trigger, gifts: val.map(Number) },
              })
            }
            options={gifts}
          />
        </div>
      ) : (
        <div className={styles.column_item}>
          <div className={styles.delimiter} />
        </div>
      )}

      <div className={styles.column_item}>
        <Btn
          width="200px"
          title={sound?.name}
          onClick={onPickSound}
          bgColor={{
            primary: "var(--background-primary)",
            secondary: "var(--background-secondary)",
          }}
          textColor="var(--font-primary)"
        >
          <span className={styles.sound_name}>
            {sound?.name ?? "Select a sound..."}
          </span>
        </Btn>
      </div>
      <div className={styles.column_item}>
        <Slider
          bgColor="var(--background-secondary)"
          max={100}
          min={0}
          onChange={(volume) => onChange({ ...alert, volume })}
          value={alert.volume}
        />
      </div>
    </div>
  );
}
