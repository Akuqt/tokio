import { Section } from "@/components";
import { formatStat } from "@/helper";
import styles from "../home.module.css";

interface Props {
  connected: boolean;
  stats: { label: string; value: number }[];
}

export function StatsSection({ connected, stats }: Props) {
  return (
    <Section title="Live Stats">
      <div className={styles.stats}>
        {stats.map(({ label, value }) => {
          const formatted = formatStat(value);
          return (
            <div key={label} className={styles.stat}>
              <span
                className={styles.stat_value}
                title={connected ? formatted.full : undefined}
              >
                {connected ? formatted.short : "--"}
              </span>
              <span className={styles.stat_label}>{label}</span>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
