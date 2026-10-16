import { ReactNode } from "react";
import styles from "./elements.module.css";

type Option<T> = {
  value: T;
  label: ReactNode;
  description?: ReactNode;
};

type Props<T extends string> = {
  name: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
};

export function RadioGroup<T extends string>({
  name,
  value,
  options,
  onChange,
}: Props<T>) {
  return (
    <div className={styles.radio_group}>
      {options.map((option) => (
        <label key={option.value} className={styles.radio_option}>
          <input
            type="radio"
            name={name}
            className={styles.radio_input}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
          />
          <span className={styles.radio_text}>
            <span className={styles.radio_label}>{option.label}</span>
            {option.description && (
              <span className={styles.radio_description}>
                {option.description}
              </span>
            )}
          </span>
        </label>
      ))}
    </div>
  );
}
