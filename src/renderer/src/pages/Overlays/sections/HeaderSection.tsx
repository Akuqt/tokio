import { Btn, Input } from "@/components";
import { useState } from "react";
import { LuPackagePlus } from "react-icons/lu";
import { MdOutlineSearch, MdOutlineSearchOff } from "react-icons/md";
import styles from "../overlays.module.css";

interface Props {
  addOverlay: () => void;
  onSearchChange: (val: string) => void;
  search: string;
}

export function HeaderSection({ addOverlay, onSearchChange, search }: Props) {
  const [showSearch, setShowSearch] = useState(false);
  return (
    <div className={styles.section}>
      <div className={styles.section_header_main_container}>
        <div className={styles.section_header_container}>
          <h2 className={styles.section_header}>Overlay Gallery</h2>
          <p className={styles.section_description}>
            Enhance your stream layout with overlays.
          </p>
        </div>
        <div className={styles.section_header_btns}>
          <div
            style={{
              opacity: showSearch ? 1 : 0,
              pointerEvents: showSearch ? "all" : "none",
              transition: "opacity 0.4s",
            }}
          >
            <Input
              textColor="var(--font-primary)"
              bgColor={{
                primary: "var(--background-primary)",
                secondary: "var(--background-secondary)",
              }}
              onChange={(e) => {
                onSearchChange(e.target.value);
              }}
              value={search}
            />
          </div>
          <Btn
            onClick={() => {
              if (showSearch) {
                onSearchChange("");
              }
              setShowSearch((c) => !c);
            }}
            textColor="var(--font-primary)"
            bgColor={{
              primary: "var(--background-primary)",
              secondary: "var(--background-secondary)",
            }}
          >
            {showSearch ? (
              <MdOutlineSearchOff size={24} />
            ) : (
              <MdOutlineSearch size={24} />
            )}
          </Btn>
          <Btn
            onClick={addOverlay}
            textColor="var(--font-primary)"
            bgColor={{
              primary: "var(--background-primary)",
              secondary: "var(--background-secondary)",
            }}
          >
            <LuPackagePlus size={20} />
          </Btn>
        </div>
      </div>
    </div>
  );
}
