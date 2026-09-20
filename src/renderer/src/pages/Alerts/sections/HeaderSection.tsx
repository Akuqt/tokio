import styles from "../alerts.module.css";

export function HeaderSection() {
  return (
    <div className={styles.section}>
      <div className={styles.section_header_main_container}>
        <div className={styles.section_header_container}>
          <h2 className={styles.section_header}>Overlay Gallery</h2>
          <p className={styles.section_description}>
            Enhance your stream with custom alerts.
          </p>
        </div>
      </div>
    </div>
  );
}
