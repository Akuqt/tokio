import { InputHTMLAttributes } from "react";
import styles from "./elements.module.css";

type Props = {
  bgColor: {
    primary: string;
    secondary: string;
  };
  textColor: string;
} & InputHTMLAttributes<HTMLInputElement>;

export function Input({ bgColor, textColor, ...rest }: Props) {
  return (
    <div className={styles.input_container}>
      <input
        {...rest}
        className={styles.input_style}
        style={{
          color: textColor,
          borderColor: bgColor.secondary,
        }}
      />
    </div>
  );
}
