import { FiPlayCircle, FiStopCircle } from "react-icons/fi";
import { Btn } from "../Elements";

// Volume of sound previews outside alerts
export const PREVIEW_VOLUME = 100;

type Props = {
  // The sound is loading or playing
  playing: boolean;
  onClick: () => void;
  disabled?: boolean;
  size?: number;
};

/**
 * Plays or stops a sound test.
 */
export function PlayButton({ playing, onClick, disabled, size = 20 }: Props) {
  return (
    <Btn
      variant="icon"
      active={playing}
      pulse
      title={playing ? "Stop" : "Play"}
      disabled={disabled}
      onClick={onClick}
    >
      {playing ? <FiStopCircle size={size} /> : <FiPlayCircle size={size} />}
    </Btn>
  );
}
