import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiChevronDown } from "react-icons/fi";
import { VscClose } from "react-icons/vsc";
import styles from "./elements.module.css";

type Option = { label: string | number; value: string | number; img?: string };

interface Props<T extends boolean | undefined> {
  options: Option[];
  labelColor: {
    active: string;
    passive: string;
  };
  bgColor: {
    active: string;
    passive: string;
  };
  searchable?: boolean;
  placeholder?: string;
  multiple?: T;

  value: T extends true
    ? string[] | number[]
    : T extends false | undefined
      ? string | number
      : string | string[] | number | number[];

  onChange: (
    val: T extends true
      ? string[] | number[]
      : T extends false | undefined
        ? string | number
        : string | string[] | number | number[],
    label?: string | number,
  ) => void;
}

export function Select<T extends boolean | undefined = undefined>(
  props: Props<T>,
) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const arrayValue = Array.isArray(props.value) ? props.value : [];

  const handleToggle = () => {
    if (!isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width, // Grab the exact width of the input
      });
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }

    function handleScroll(event: Event) {
      // Ignore scroll events that happen inside the dropdown itself
      if (
        popoverRef.current &&
        popoverRef.current.contains(event.target as Node)
      ) {
        return;
      }
      if (isOpen) setIsOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
    }
  }, [isOpen]);

  const renderDisplay = () => {
    if (props.multiple) {
      const selected = new Set(arrayValue);
      const selectedLabels = props.options.filter((op) =>
        selected.has(op.value),
      );

      return (
        <div className={styles.multi_select_label_group}>
          {selectedLabels.length > 0 ? (
            selectedLabels.map((lb) => (
              <span key={lb.value} className={styles.multi_select_label}>
                {lb.img && <img src={lb.img} className={styles.select_img} />}
                <label>{lb.label}</label>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const data = new Set(selected);
                    data.delete(lb.value);
                    props.onChange(Array.from(data) as any);
                  }}
                >
                  <VscClose
                    size={18}
                    color={props.labelColor.passive}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = props.labelColor.active;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = props.labelColor.passive;
                    }}
                  />
                </button>
              </span>
            ))
          ) : (
            <span>{props.placeholder ?? "Select an option..."}</span>
          )}
        </div>
      );
    } else {
      const selectedLabel = props.options.find(
        (opt) => opt.value === props.value,
      );
      return (
        <div className={styles.select_single_label}>
          {selectedLabel?.label ? (
            <>
              {selectedLabel.img && (
                <img src={selectedLabel.img} className={styles.select_img} />
              )}
              <label>{selectedLabel.label}</label>
            </>
          ) : (
            <>{props.placeholder ?? "Select an option..."}</>
          )}
        </div>
      );
    }
  };

  const lowerSearchTerm = searchTerm.toLowerCase();
  const filteredOptions = props.options.filter((opt) =>
    String(opt.label).toLowerCase().includes(lowerSearchTerm),
  );

  const rowVirtualizer = useVirtualizer({
    count: filteredOptions.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 44,
    overscan: 5,
  });

  return (
    <div className={styles.select_container} ref={containerRef}>
      <div
        onClick={handleToggle}
        className={styles.select_display}
        style={{
          backgroundColor: props.bgColor.active,
          color: props.labelColor.active,
          borderColor: props.bgColor.passive,
        }}
      >
        {renderDisplay()}

        <div className={styles.select_icon}>
          <FiChevronDown
            size={16}
            style={{
              transition: "transform 0.2s",
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            }}
          />
        </div>
      </div>

      {isOpen &&
        createPortal(
          <div
            ref={popoverRef}
            className={styles.select_area}
            style={{
              backgroundColor: props.bgColor.passive,
              top: coords.top,
              left: coords.left,
              width: coords.width,
            }}
          >
            {props.searchable && (
              <div
                className={styles.search_container}
                style={{ backgroundColor: props.bgColor.passive }}
              >
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className={styles.search_input}
                  style={{
                    backgroundColor: props.bgColor.active,
                    color: props.labelColor.active,
                    borderBottomColor: props.labelColor.passive,
                  }}
                />
              </div>
            )}

            <div
              ref={scrollContainerRef}
              style={{
                maxHeight: "220px",
                overflowY: "auto",
              }}
            >
              {filteredOptions.length > 0 ? (
                <div
                  style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: "100%",
                    position: "relative",
                  }}
                >
                  {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                    const opt = filteredOptions[virtualItem.index];
                    const isActive = props.multiple
                      ? new Set(arrayValue).has(opt.value)
                      : props.value === opt.value;

                    return (
                      <div
                        key={virtualItem.key}
                        onClick={() => {
                          if (props.multiple) {
                            const data = new Set(arrayValue);
                            if (data.has(opt.value)) {
                              data.delete(opt.value);
                            } else {
                              data.add(opt.value);
                            }
                            props.onChange(Array.from(data) as any);
                          } else {
                            props.onChange(opt.value as any, opt.label);
                            setIsOpen(false);
                          }
                        }}
                        className={styles.select_item}
                        onMouseEnter={(e) => {
                          if (isActive) return;
                          e.currentTarget.style.backgroundColor =
                            props.bgColor.active;
                        }}
                        onMouseLeave={(e) => {
                          if (isActive) return;
                          e.currentTarget.style.backgroundColor =
                            props.bgColor.passive;
                        }}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          margin: 0,
                          height: `${virtualItem.size - 4}px`,
                          transform: `translateY(${virtualItem.start + 2}px)`,
                          color: isActive
                            ? props.labelColor.active
                            : props.labelColor.passive,
                          backgroundColor: isActive
                            ? props.bgColor.active
                            : props.bgColor.passive,
                        }}
                      >
                        {opt.img && (
                          <img src={opt.img} className={styles.select_img} />
                        )}
                        <label>{opt.label}</label>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div
                  className={styles.select_item}
                  style={{ color: props.labelColor.passive }}
                >
                  No options found
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
