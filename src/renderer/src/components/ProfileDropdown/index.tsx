import { useEffect, useRef, useState } from "react";
import { FiCheck, FiChevronDown } from "react-icons/fi";
import styles from "./profiledropdown.module.css";

type Profile = {
  name: string;
  active: boolean;
  file: string;
};

type Props = {
  onProfileSelected: (file: string) => void;
  profiles: Profile[];
};

export function ProfileDropdown({ profiles, onProfileSelected }: Props) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeProfile, setActiveProfile] = useState(
    profiles.find((p) => p.active),
  );
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

  return (
    <div className={styles.container} ref={dropdownRef}>
      <div
        onClick={() => setIsProfileOpen((c) => !c)}
        className={styles.toggle}
        style={{
          color: isProfileOpen
            ? "var(--font-color-primary)"
            : "var(--font-color-secondary)",
          backgroundColor: isProfileOpen
            ? "var(--nav-bar-profile-selected-background)"
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
                    ? "var(--font-color-primary)"
                    : "var(--font-color-secondary)",
                backgroundColor:
                  activeProfile?.file === profile.file
                    ? "var(--nav-bar-profile-selected-background)"
                    : "transparent",
              }}
            >
              {profile.name}
              {activeProfile?.file === profile.file && (
                <FiCheck
                  size={14}
                  color="var(--nav-bar-profile-selected-tick)"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
