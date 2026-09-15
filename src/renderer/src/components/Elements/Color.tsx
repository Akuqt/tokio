import { useEffect, useRef, useState } from "react";
import { HexAlphaColorPicker, HexColorInput } from "react-colorful";
import { createPortal } from "react-dom";
import styles from "./elements.module.css";

type Props = {
  value: string;
  borderColor: string;
  bgColor: string;
  txtColor: string;
  onChange: (color: string) => void;
};

export function Color({
  value,
  onChange,
  borderColor,
  bgColor,
  txtColor,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => {
    if (!isOpen && containerRef.current) {
      // Calculate where the button is on the screen
      const rect = containerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + 8, // 8px gap below the button
        left: rect.left,
      });
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      // Check if click is outside BOTH the container and the portaled popover
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }

    // Optional but highly recommended: Close popover if the user scrolls the modal
    function handleScroll() {
      if (isOpen) setIsOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    // Use capture phase (true) to catch scrolling on inner containers, not just the window
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen]);

  return (
    <div className={styles.color_container} ref={containerRef}>
      <button
        className={styles.color_swatch}
        style={{ backgroundColor: value, borderColor: borderColor }}
        onClick={handleToggle}
        aria-label="Choose color"
      />

      {isOpen &&
        createPortal(
          <div
            ref={popoverRef}
            className={styles.color_popover}
            style={{
              backgroundColor: bgColor,
              top: coords.top,
              left: coords.left,
            }}
          >
            <HexAlphaColorPicker
              className={styles.picker}
              color={value}
              onChange={onChange}
            />
            <HexColorInput
              color={value}
              onChange={onChange}
              placeholder="Type a color"
              prefixed
              alpha
              className={styles.color_input}
              style={{
                borderBottomColor: txtColor,
                color: txtColor,
              }}
            />
          </div>,
          document.body,
        )}
    </div>
  );
}
