import { Profile } from "@/common/schemas";
import { Btn, Input, Section, Toggle } from "@/components";
import { Updater } from "@/hooks";
import { MdOutlineAddAlert } from "react-icons/md";
import styles from "../alerts.module.css";
import { createAlert } from "../helper";

type Props = {
  simultaneous: boolean;
  queueLength: number;
  update: Updater<Profile["alerts"]>;
};

export function HeaderSection({ simultaneous, queueLength, update }: Props) {
  return (
    <Section
      title="Alerts"
      description="Enhance your stream with custom alerts."
      actions={
        <Btn
          title="Add alert"
          onClick={() =>
            update((s) => {
              s.items.push(createAlert());
            })
          }
        >
          <MdOutlineAddAlert size={20} />
        </Btn>
      }
    >
      <div className={styles.settings}>
        <Toggle
          label="Play alerts simultaneously"
          checked={simultaneous}
          onChange={(e) =>
            update((s) => {
              s.simultaneous = e.target.checked;
            })
          }
        />
        <label className={styles.queue_length}>
          Max queue length
          <Input
            type="number"
            min={1}
            className={styles.number_input}
            value={queueLength}
            onChange={(e) =>
              update((s) => {
                s.queue_length = Math.max(
                  1,
                  Math.floor(Number(e.target.value)) || 1,
                );
              })
            }
          />
        </label>
      </div>
    </Section>
  );
}
