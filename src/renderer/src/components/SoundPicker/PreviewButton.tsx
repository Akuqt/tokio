import { FiPlayCircle, FiStopCircle } from "react-icons/fi";
import styles from "./soundpicker.module.css";

export const PREVIEW_VOLUME = 100;

type Props = {
  // This sound's preview is loading or playing
  playing: boolean;
  onClick: () => void;
};

export function PreviewButton({ playing, onClick }: Props) {
  return (
    <button
      className={`${styles.icon_btn} ${playing ? styles.playing : ""}`}
      title={playing ? "Stop preview" : "Preview"}
      onClick={onClick}
    >
      {playing ? <FiStopCircle size={20} /> : <FiPlayCircle size={20} />}
    </button>
  );
}
