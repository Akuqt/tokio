import { EntityMetadata } from "@/common/schemas";
import { cx } from "@/helper/cx";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useRef, useState } from "react";
import { FiCheck, FiChevronDown } from "react-icons/fi";
import styles from "./profiledropdown.module.css";

type Props = {
  onProfileSelected: (file: string) => void;
  active: EntityMetadata;
  profiles: EntityMetadata[];
  disabled: boolean;
};

export function ProfileDropdown({
  profiles,
  onProfileSelected,
  active,
  disabled,
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useClickOutside([ref], () => setOpen(false), open);

  return (
    <div className={styles.container} ref={ref}>
      <div
        onClick={() => {
          if (!disabled) setOpen((o) => !o);
        }}
        className={cx(
          styles.toggle,
          open && styles.toggle_open,
          disabled && styles.toggle_disabled,
        )}
      >
        <div className={styles.avatar}>🌹</div>
        <span>{active.name}</span>
        <FiChevronDown
          size={14}
          className={cx(styles.chevron, open && styles.chevron_open)}
        />
      </div>

      {open && (
        <div className={styles.menu}>
          {profiles.map((profile) => {
            const isActive = profile.file === active.file;
            return (
              <div
                key={profile.file}
                className={cx(styles.item, isActive && styles.item_active)}
                onClick={() => {
                  setOpen(false);
                  if (!isActive) onProfileSelected(profile.file);
                }}
              >
                {profile.name}
                {isActive && (
                  <FiCheck size={14} color="var(--accent-primary)" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
