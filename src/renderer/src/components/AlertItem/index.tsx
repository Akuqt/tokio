import { Alert, ALERT_TRIGGERS } from "@/common/schemas";
import { ALERT_TRIGGER_LABELS, CustomGift, TOKIO_EVENTS } from "@/common/types";
import { AlertTestRequest } from "@/hooks/useAlertTest";
import { FiTrash2 } from "react-icons/fi";
import {
  Btn,
  MultiSelect,
  Select,
  SelectOption,
  Slider,
  Toggle,
} from "../Elements";
import { PlayButton } from "../PlayButton";
import styles from "./alertitem.module.css";

type Trigger = Alert["trigger"]["type"];

// zod types the options as any live event, but they are the triggers.
const TRIGGER_OPTIONS = ALERT_TRIGGERS.map((value) => ({
  value,
  label: ALERT_TRIGGER_LABELS[value],
})) as SelectOption<Trigger>[];

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
    <div className={styles.row}>
      <div className={styles.cell}>
        <PlayButton
          playing={testing}
          size={24}
          disabled={!sound}
          onClick={() => {
            if (!sound) return;
            onTest({ id: alert.id, file: sound.file, volume: alert.volume });
          }}
        />
        <Btn variant="icon" title="Remove" onClick={onRemove}>
          <FiTrash2 size={24} />
        </Btn>
      </div>

      <div className={styles.cell}>
        <Toggle
          checked={alert.enabled}
          onChange={(e) => onChange({ ...alert, enabled: e.target.checked })}
        />
      </div>

      <div className={styles.cell}>
        <Select
          className={styles.fill}
          placeholder="Select a trigger..."
          options={TRIGGER_OPTIONS}
          value={alert.trigger.type}
          onChange={(type) =>
            onChange({ ...alert, trigger: { ...alert.trigger, type } })
          }
        />
      </div>

      <div className={styles.cell}>
        {alert.trigger.type === TOKIO_EVENTS.GIFT ? (
          <MultiSelect
            className={styles.fill}
            searchable
            placeholder="Any gift"
            options={gifts}
            value={alert.trigger.gifts}
            onChange={(ids) =>
              onChange({ ...alert, trigger: { ...alert.trigger, gifts: ids } })
            }
          />
        ) : (
          <div className={styles.delimiter} />
        )}
      </div>

      <div className={styles.cell}>
        <Btn className={styles.sound} title={sound?.name} onClick={onPickSound}>
          <span className={styles.sound_name}>
            {sound?.name ?? "Select a sound..."}
          </span>
        </Btn>
      </div>

      <div className={styles.cell}>
        <Slider
          min={0}
          max={100}
          value={alert.volume}
          onChange={(volume) => onChange({ ...alert, volume })}
        />
      </div>
    </div>
  );
}
