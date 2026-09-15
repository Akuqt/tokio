import { CSSProperties } from "react";
import styles from "./elements.module.css";

type Props = {
  bgColor: string;
  showValue?: boolean;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
};

export function Slider({
  bgColor,
  showValue,
  value,
  onChange,
  max,
  min,
}: Props) {
  return (
    <div className={styles.slider_container}>
      <input
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => {
          onChange(Number(e.target.value));
        }}
        type="range"
        className={styles.slider_style}
        style={
          {
            "--dynamic-bg": bgColor,
          } as CSSProperties
        }
      />
      {showValue && <h3 className={styles.slider_value}>{value}</h3>}
    </div>
  );
}
