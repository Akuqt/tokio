import { CSSProperties, InputHTMLAttributes } from "react";
import styles from "./elements.module.css";

type Props = {
  bgColor: string;
} & InputHTMLAttributes<HTMLInputElement>;

export function Toggle({ bgColor, ...rest }: Props) {
  return (
    <label className={styles.toggle_container}>
      <input {...rest} type="checkbox" className={styles.toggle_style} />
      <span
        className={styles.toggle_slider}
        style={
          {
            "--toggle-bg": bgColor,
          } as CSSProperties
        }
      ></span>
    </label>
  );
}
