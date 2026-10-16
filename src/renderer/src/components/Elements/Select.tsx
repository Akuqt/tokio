import { cx } from "@/helper/cx";
import { usePopover } from "@/hooks/usePopover";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ReactNode, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiChevronDown } from "react-icons/fi";
import { VscClose } from "react-icons/vsc";
import styles from "./elements.module.css";

type Value = string | number;

export type SelectOption<V extends Value = Value> = {
  label: string | number;
  value: V;
  img?: string;
  // Options with a group are listed under its name. Keep them sorted by group.
  group?: string;
};

type CommonProps<V extends Value> = {
  options: SelectOption<V>[];
  searchable?: boolean;
  placeholder?: string;
  className?: string;
};

const OPTION_HEIGHT = 44;
const GROUP_HEIGHT = 28;

export function Select<V extends Value>({
  value,
  onChange,
  ...common
}: CommonProps<V> & {
  value: V | undefined;
  onChange: (value: V) => void;
}) {
  const selected = common.options.find((opt) => opt.value === value);

  return (
    <SelectBase
      {...common}
      isSelected={(v) => v === value}
      onPick={(v) => {
        onChange(v);
        return true;
      }}
      display={
        selected ? (
          <span className={styles.select_label}>
            {selected.img && (
              <img src={selected.img} className={styles.select_img} />
            )}
            {selected.label}
          </span>
        ) : null
      }
    />
  );
}

export function MultiSelect<V extends Value>({
  value,
  onChange,
  ...common
}: CommonProps<V> & {
  value: V[];
  onChange: (value: V[]) => void;
}) {
  const selected = new Set(value);
  const chips = common.options.filter((opt) => selected.has(opt.value));

  return (
    <SelectBase
      {...common}
      isSelected={(v) => selected.has(v)}
      onPick={(v) => {
        onChange(
          selected.has(v) ? value.filter((item) => item !== v) : [...value, v],
        );
        return false;
      }}
      display={
        chips.length > 0 ? (
          <span className={styles.select_chips}>
            {chips.map((chip) => (
              <span key={chip.value} className={styles.select_chip}>
                {chip.img && (
                  <img src={chip.img} className={styles.select_img} />
                )}
                {chip.label}
                <button
                  type="button"
                  className={styles.select_chip_remove}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(value.filter((item) => item !== chip.value));
                  }}
                >
                  <VscClose size={18} />
                </button>
              </span>
            ))}
          </span>
        ) : null
      }
    />
  );
}

type BaseProps<V extends Value> = CommonProps<V> & {
  // What the closed select shows, null for the placeholder
  display: ReactNode;
  isSelected: (value: V) => boolean;
  // Returns whether to close the list
  onPick: (value: V) => boolean;
};

function SelectBase<V extends Value>({
  options,
  searchable,
  placeholder = "Select an option...",
  className,
  display,
  isSelected,
  onPick,
}: BaseProps<V>) {
  const { open, toggle, close, position, anchorRef, popoverRef } = usePopover();

  return (
    <div ref={anchorRef} className={className}>
      <div className={styles.select_display} onClick={toggle}>
        {display ?? (
          <span className={styles.select_placeholder}>{placeholder}</span>
        )}
        <FiChevronDown
          size={16}
          className={cx(
            styles.select_chevron,
            open && styles.select_chevron_open,
          )}
        />
      </div>

      {open &&
        createPortal(
          <div
            ref={popoverRef}
            className={styles.popover}
            style={{
              top: position.top,
              left: position.left,
              width: position.width,
            }}
          >
            <SelectMenu
              options={options}
              searchable={searchable}
              isSelected={isSelected}
              onPick={(v) => {
                if (onPick(v)) close();
              }}
            />
          </div>,
          document.body,
        )}
    </div>
  );
}

type Row<V extends Value> =
  | { kind: "group"; label: string }
  | { kind: "option"; option: SelectOption<V> };

function buildRows<V extends Value>(
  options: SelectOption<V>[],
  search: string,
): Row<V>[] {
  const needle = search.trim().toLowerCase();
  const rows: Row<V>[] = [];
  let group: string | undefined;

  for (const option of options) {
    const matches =
      String(option.label).toLowerCase().includes(needle) ||
      (option.group?.toLowerCase().includes(needle) ?? false);
    if (!matches) continue;

    if (option.group !== undefined && option.group !== group) {
      group = option.group;
      rows.push({ kind: "group", label: group });
    }
    rows.push({ kind: "option", option });
  }

  return rows;
}

// Mounted only while open, so the search starts empty every time.
function SelectMenu<V extends Value>({
  options,
  searchable,
  isSelected,
  onPick,
}: {
  options: SelectOption<V>[];
  searchable?: boolean;
  isSelected: (value: V) => boolean;
  onPick: (value: V) => void;
}) {
  const [search, setSearch] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const rows = useMemo(() => buildRows(options, search), [options, search]);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => listRef.current,
    estimateSize: (index) =>
      rows[index].kind === "group" ? GROUP_HEIGHT : OPTION_HEIGHT,
    overscan: 5,
  });

  return (
    <>
      {searchable && (
        <div className={styles.select_search}>
          <input
            type="text"
            placeholder="Search..."
            className={styles.select_search_input}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>
      )}

      <div ref={listRef} className={styles.select_list}>
        {rows.length === 0 ? (
          <div className={styles.select_empty}>No options found</div>
        ) : (
          <div
            className={styles.select_rows}
            style={{ height: virtualizer.getTotalSize() }}
          >
            {virtualizer.getVirtualItems().map((item) => {
              const row = rows[item.index];
              return (
                <div
                  key={item.key}
                  className={styles.select_row}
                  style={{
                    height: item.size,
                    transform: `translateY(${item.start}px)`,
                  }}
                >
                  {row.kind === "group" ? (
                    <div className={styles.select_group}>{row.label}</div>
                  ) : (
                    <div
                      className={cx(
                        styles.select_item,
                        isSelected(row.option.value) &&
                          styles.select_item_active,
                      )}
                      onClick={() => onPick(row.option.value)}
                    >
                      {row.option.img && (
                        <img
                          src={row.option.img}
                          className={styles.select_img}
                        />
                      )}
                      {row.option.label}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
