import { ButtonHTMLAttributes, PropsWithChildren } from "react";
import styles from "./elements.module.css";

type Props = {
  bgColor: {
    primary: string;
    secondary: string;
  };
  textColor: string;
} & PropsWithChildren &
  ButtonHTMLAttributes<HTMLButtonElement>;

export function Btn({ children, bgColor, textColor, ...rest }: Props) {
  return (
    <button
      className={styles.btn}
      {...rest}
      style={{
        backgroundColor: bgColor.primary,
        color: textColor,
        borderColor: bgColor.secondary,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = bgColor.secondary;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = bgColor.primary;
      }}
    >
      {children}
    </button>
  );
}
