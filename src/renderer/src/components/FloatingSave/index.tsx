import { cx } from "@/helper/cx";
import { FiSave } from "react-icons/fi";
import styles from "./floatingsave.module.css";

type Props = {
  // Shown only while there are unsaved changes
  visible: boolean;
  onSave: () => void;
};

export function FloatingSave({ visible, onSave }: Props) {
  return (
    <button
      type="button"
      title="Save changes"
      className={cx(styles.save, visible && styles.visible)}
      disabled={!visible}
      onClick={onSave}
    >
      <FiSave size={30} />
    </button>
  );
}
