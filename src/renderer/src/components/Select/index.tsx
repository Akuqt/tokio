import { useEffect, useRef, useState } from "react";
import { FiChevronDown } from "react-icons/fi";
import styles from "./select.module.css";

export function CustomSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { label: string; value: string }[];
  onChange: (val: string, label?: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel =
    options.find((opt) => opt.label === value)?.label || value;

  return (
    <div className={styles.container} ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className={styles.select_display}>
        <span>{selectedLabel}</span>
        <FiChevronDown
          style={{
            transition: "transform 0.2s",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </div>

      {isOpen && (
        <div className={styles.select_area}>
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => {
                onChange(opt.value, opt.label);
                setIsOpen(false);
              }}
              className={styles.select_item}
              style={{
                color:
                  value === opt.label
                    ? "var(--font-primary)"
                    : "var(--font-secondary)",
                backgroundColor:
                  value === opt.label
                    ? "var(--background-secondary)"
                    : "transparent",
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
