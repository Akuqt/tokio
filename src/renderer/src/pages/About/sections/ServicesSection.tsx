import { Section } from "@/components";
import { FiGlobe } from "react-icons/fi";
import styles from "../about.module.css";
import { SERVICES } from "../helper";

export function ServicesSection() {
  return (
    <Section
      icon={<FiGlobe />}
      title="Online services"
      description="Tokio talks to these services. They aren't covered by Tokio's license or the licenses above: each one is subject to its operator's terms and can stop working at any time."
    >
      <div className={styles.list}>
        {SERVICES.map(({ name, note }) => (
          <div key={name} className={styles.row}>
            <div className={styles.row_info}>
              <span className={styles.row_name}>{name}</span>
              <p className={styles.muted}>{note}</p>
            </div>
          </div>
        ))}
      </div>
      <p className={styles.muted}>
        Tokio is not affiliated with, endorsed by, or associated with TikTok or
        ByteDance Ltd.
      </p>
    </Section>
  );
}
