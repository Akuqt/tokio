import styles from "./alerts.module.css";
import { HeaderSection } from "./sections/HeaderSection";

export function Alerts() {
  return (
    <div className={styles.container}>
      <HeaderSection />
      <span className={styles.section_delimiter} />
    </div>
  );
}
