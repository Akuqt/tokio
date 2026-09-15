import { InputHTMLAttributes } from "react";
import styles from "./elements.module.css";

type Props = InputHTMLAttributes<HTMLInputElement>;

export function Check({ ...rest }: Props) {
  return (
    <div className={styles.check_container}>
      <input {...rest} type="checkbox" className={styles.check_style} />
    </div>
  );
}
