import { cx } from "@/helper/cx";
import { usePopover } from "@/hooks/usePopover";
import { HexAlphaColorPicker, HexColorInput } from "react-colorful";
import { createPortal } from "react-dom";
import styles from "./elements.module.css";

type Props = {
  // A color like #ff000080
  value: string;
  onChange: (color: string) => void;
};

export function Color({ value, onChange }: Props) {
  const { open, toggle, position, anchorRef, popoverRef } = usePopover(8);

  return (
    <div ref={anchorRef} className={styles.color_anchor}>
      <button
        type="button"
        className={styles.color_swatch}
        style={{ backgroundColor: value }}
        onClick={toggle}
        aria-label="Choose color"
      />

      {open &&
        createPortal(
          <div
            ref={popoverRef}
            className={cx(styles.popover, styles.color_popover)}
            style={{ top: position.top, left: position.left }}
          >
            <HexAlphaColorPicker
              className={styles.picker}
              color={value}
              onChange={onChange}
            />
            <HexColorInput
              className={styles.color_input}
              color={value}
              onChange={onChange}
              placeholder="Type a color"
              prefixed
              alpha
            />
          </div>,
          document.body,
        )}
    </div>
  );
}
