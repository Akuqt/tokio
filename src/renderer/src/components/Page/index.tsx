import { cx } from "@/helper/cx";
import { ReactNode } from "react";
import styles from "./page.module.css";

type PageProps = {
  // wide fits tables such as the alerts list
  width?: "default" | "wide";
  children: ReactNode;
};

/**
 * Centered page column. Sections inside are separated by a divider.
 */
export function Page({ width = "default", children }: PageProps) {
  return (
    <div className={cx(styles.page, width === "wide" && styles.page_wide)}>
      {children}
    </div>
  );
}

type SectionProps = {
  // Without title, description and actions there's no header
  title?: ReactNode;
  description?: ReactNode;
  // Shown before the title
  icon?: ReactNode;
  // Buttons on the right of the title
  actions?: ReactNode;
  children?: ReactNode;
};

export function Section({
  title,
  description,
  icon,
  actions,
  children,
}: SectionProps) {
  return (
    <section className={styles.section}>
      {(title || description || actions) && (
        <header className={styles.section_header}>
          <div>
            {title && (
              <h2 className={styles.section_title}>
                {icon}
                {title}
              </h2>
            )}
            {description && (
              <p className={styles.section_description}>{description}</p>
            )}
          </div>
          {actions && <div className={styles.section_actions}>{actions}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

type FieldProps = {
  label?: ReactNode;
  // Secondary text after the label, e.g. "(seconds)"
  hint?: ReactNode;
  className?: string;
  children: ReactNode;
};

/**
 * A labelled control.
 */
export function Field({ label, hint, className, children }: FieldProps) {
  return (
    <div className={cx(styles.field, className)}>
      {label && (
        <label className={styles.field_label}>
          {label}
          {hint && <span className={styles.field_hint}>{hint}</span>}
        </label>
      )}
      {children}
    </div>
  );
}

/**
 * Two column grid of fields.
 */
export function FormGrid({ children }: { children: ReactNode }) {
  return <div className={styles.grid}>{children}</div>;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className={styles.empty}>{children}</p>;
}
