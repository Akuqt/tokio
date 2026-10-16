import { OverlayApp } from "@/common/types";
import { Btn, EmptyState, Input, OverlayView, Section } from "@/components";
import { cx } from "@/helper";
import { useMemo, useState } from "react";
import { LuPackagePlus } from "react-icons/lu";
import { MdOutlineSearch, MdOutlineSearchOff } from "react-icons/md";
import styles from "../overlays.module.css";

interface Props {
  overlays: OverlayApp[];
  onImport: () => void;
  onTest: (id: string) => void;
  onCustomize: (id: string) => void;
}

export function GallerySection({
  overlays,
  onImport,
  onTest,
  onCustomize,
}: Props) {
  const [showSearch, setShowSearch] = useState(false);
  const [search, setSearch] = useState("");

  const shown = useMemo(() => {
    const needle = search.toLowerCase();
    return overlays.filter((o) => o.name.toLowerCase().includes(needle));
  }, [overlays, search]);

  return (
    <Section
      title="Overlay Gallery"
      description="Enhance your stream layout with overlays."
      actions={
        <>
          <Input
            className={cx(styles.search, showSearch && styles.search_open)}
            placeholder="Search overlays..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Btn
            title={showSearch ? "Close search" : "Search"}
            onClick={() => {
              if (showSearch) setSearch("");
              setShowSearch(!showSearch);
            }}
          >
            {showSearch ? (
              <MdOutlineSearchOff size={24} />
            ) : (
              <MdOutlineSearch size={24} />
            )}
          </Btn>
          <Btn title="Import overlay" onClick={onImport}>
            <LuPackagePlus size={20} />
          </Btn>
        </>
      }
    >
      {shown.length > 0 ? (
        shown.map((overlay) => (
          <OverlayView
            key={overlay.id}
            width="768px"
            height="432px"
            overlay={overlay}
            onTest={onTest}
            onCustomize={onCustomize}
          />
        ))
      ) : (
        <EmptyState>No overlays found.</EmptyState>
      )}
    </Section>
  );
}
