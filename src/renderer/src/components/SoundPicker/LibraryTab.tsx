import { AlertSound } from "@/common/schemas";
import { AlertTestRequest } from "@/hooks/useAlertTest";
import { useState } from "react";
import { FiCheck } from "react-icons/fi";
import { Btn, Input } from "../Elements";
import { PlayButton, PREVIEW_VOLUME } from "../PlayButton";
import styles from "./soundpicker.module.css";

type Props = {
  library: AlertSound[];
  testing: string | null;
  onTest: (req: AlertTestRequest) => void;
  onSelect: (sound: AlertSound) => void;
};

export function LibraryTab({ library, testing, onTest, onSelect }: Props) {
  const [filter, setFilter] = useState("");

  const needle = filter.trim().toLowerCase();
  const sounds = library.filter((s) => s.name.toLowerCase().includes(needle));

  const emptyText =
    library.length === 0
      ? "No uploaded sounds. Add them in Settings, or browse for a file."
      : "No sounds match.";

  return (
    <>
      <Input
        placeholder="Filter your sounds..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />

      <div className={styles.list}>
        {sounds.map((sound) => (
          <div key={sound.file} className={styles.row}>
            <span className={styles.name} title={sound.name}>
              {sound.name}
            </span>
            <PlayButton
              playing={testing === sound.file}
              onClick={() =>
                onTest({
                  id: sound.file,
                  file: sound.file,
                  volume: PREVIEW_VOLUME,
                })
              }
            />
            <Btn
              variant="icon"
              title="Use this sound"
              onClick={() => onSelect(sound)}
            >
              <FiCheck size={20} />
            </Btn>
          </div>
        ))}

        {sounds.length === 0 && <p className={styles.status}>{emptyText}</p>}
      </div>
    </>
  );
}
