import { cx } from "@/helper/cx";
import { ChoiceProps } from "./Check";
import styles from "./elements.module.css";

export function Toggle({ label, className, ...rest }: ChoiceProps) {
  return (
    <label className={cx(styles.choice_label, className)}>
      <span className={styles.toggle}>
        <input {...rest} type="checkbox" className={styles.toggle_input} />
        <span className={styles.toggle_track} />
      </span>
      {label}
    </label>
  );
}
