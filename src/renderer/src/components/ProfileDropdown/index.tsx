import { EntityMetadata } from "@/common/schemas";
import { useEffect, useRef, useState } from "react";
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
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeProfile, setActiveProfile] = useState(active);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setActiveProfile(active);
  }, [active]);

  return (
    <div className={styles.container} ref={dropdownRef}>
      <div
        onClick={() => {
          if (!disabled) setIsProfileOpen((c) => !c);
        }}
        className={styles.toggle}
        style={{
          color: isProfileOpen
            ? "var(--font-primary)"
            : "var(--font-secondary)",
          backgroundColor:
            isProfileOpen || disabled
              ? "var(--background-secondary-hover)"
              : "transparent",
        }}
      >
        <div className={styles.profile}>🌹</div>
        <span>{activeProfile?.name}</span>
        <FiChevronDown
          size={14}
          style={{
            transform: isProfileOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        />
      </div>

      {isProfileOpen && (
        <div className={styles.profiles_container}>
          {profiles.map((profile, key) => (
            <div
              key={key}
              className={styles.profiles_item}
              onClick={() => {
                setIsProfileOpen(false);
                if (profile.file !== activeProfile?.file) {
                  onProfileSelected(profile.file);
                  setActiveProfile(profile);
                }
              }}
              style={{
                color:
                  activeProfile?.file === profile.file
                    ? "var(--font-primary)"
                    : "var(--font-secondary)",
                backgroundColor:
                  activeProfile?.file === profile.file
                    ? "var(--background-secondary-hover)"
                    : "transparent",
              }}
            >
              {profile.name}
              {activeProfile?.file === profile.file && (
                <FiCheck size={14} color="var(--accent-primary)" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
