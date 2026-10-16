import { cx } from "@/helper/cx";
import { InputHTMLAttributes, ReactNode } from "react";
import styles from "./elements.module.css";

export type ChoiceProps = {
  label?: ReactNode;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export function Check({ label, className, ...rest }: ChoiceProps) {
  const input = (
    <input {...rest} type="checkbox" className={cx(styles.check, className)} />
  );

  if (label === undefined) return input;

  return (
    <label className={styles.choice_label}>
      {input}
      {label}
    </label>
  );
}
