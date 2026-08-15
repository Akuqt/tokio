import React, { useEffect, useRef, useState } from "react";
import { FiChevronDown } from "react-icons/fi";

const inputStyle: React.CSSProperties = {
  backgroundColor: "var(--background-color-secondary)",
  color: "var(--font-color-primary)",
  border: "1px solid var(--nav-bar-profile-selected-background)",
  borderRadius: "4px",
  padding: "0 12px", // Removed vertical padding, relying on explicit height
  height: "40px", // Explicit height guarantees perfect alignment
  fontSize: "14px",
  outline: "none",
  transition: "border-color 0.2s",
  boxSizing: "border-box",
  width: "100%",
};

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
    <div style={{ position: "relative", width: "100%" }} ref={dropdownRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          ...inputStyle,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
        }}
      >
        <span>{selectedLabel}</span>
        <FiChevronDown
          style={{
            transition: "transform 0.2s",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </div>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            backgroundColor: "var(--background-color-primary)",
            border: "1px solid var(--nav-bar-profile-selected-background)",
            borderRadius: "4px",
            boxShadow: "0 8px 16px rgba(0, 0, 0, 0.6)",
            zIndex: 1000,
            maxHeight: "200px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            padding: "4px",
          }}
        >
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => {
                onChange(opt.value, opt.label);
                setIsOpen(false);
              }}
              style={{
                padding: "10px 12px",
                fontSize: "14px",
                color:
                  value === opt.value
                    ? "var(--font-color-primary)"
                    : "var(--font-color-secondary)",
                cursor: "pointer",
                borderRadius: "4px",
                backgroundColor:
                  value === opt.value
                    ? "var(--nav-bar-profile-selected-background)"
                    : "transparent",
              }}
              onMouseEnter={(e) => {
                if (value !== opt.value)
                  e.currentTarget.style.backgroundColor =
                    "var(--nav-bar-profile-hover)";
              }}
              onMouseLeave={(e) => {
                if (value !== opt.value)
                  e.currentTarget.style.backgroundColor = "transparent";
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
