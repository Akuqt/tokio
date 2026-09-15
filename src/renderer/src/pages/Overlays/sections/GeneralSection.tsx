import styles from "../overlays.module.css";

interface Props {
  onClick: () => void;
}

export function GeneralSection({ onClick }: Props) {
  return (
    <div className={styles.section}>
      <div>
        <h2 className={styles.section_header}>General Overlays</h2>
        <p className={styles.section_description}>
          Configure your primary alert settings here.
        </p>
        <button onClick={onClick}>Add Overlay</button>
      </div>
    </div>
  );
}
