import { Btn, Section } from "@/components";
import { FiExternalLink, FiFileText, FiPackage } from "react-icons/fi";
import styles from "../about.module.css";
import { COMPONENTS } from "../helper";

type Props = {
  onView: (id: string) => void;
};

export function ComponentsSection({ onView }: Props) {
  return (
    <Section
      icon={<FiPackage />}
      title="Third-party components"
      description="Code and assets included in Tokio that don't come from an npm package."
    >
      <div className={styles.list}>
        {COMPONENTS.map(({ name, author, license, url, note, doc }) => (
          <div key={name} className={styles.row}>
            <div className={styles.row_info}>
              <div className={styles.row_title}>
                <span className={styles.row_name}>{name}</span>
                <span className={styles.badge}>{license}</span>
              </div>
              <p className={styles.muted}>{author}</p>
              <p className={styles.muted}>{note}</p>
            </div>
            <a
              className={styles.link}
              href={url}
              target="_blank"
              rel="noreferrer"
              title="Website"
            >
              <FiExternalLink size={18} />
            </a>
            {doc && (
              <Btn
                variant="icon"
                title="View license"
                onClick={() => onView(doc)}
              >
                <FiFileText size={18} />
              </Btn>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}
