import { AppSettings } from "@/common/schemas";
import { Check, Section } from "@/components";
import styles from "../home.module.css";

type Features = AppSettings["activeFeatures"];

const FEATURES: { key: keyof Features; label: string }[] = [
  { key: "tts", label: "TTS" },
  { key: "music", label: "Music" },
  { key: "alerts", label: "Alerts" },
];

interface Props {
  features: Features;
  onChange: (feature: keyof Features, enabled: boolean) => void;
}

export function FeaturesSection({ features, onChange }: Props) {
  return (
    <Section
      title="Active Features"
      description="Toggle which modules are actively running during this session."
    >
      <div className={styles.features}>
        {FEATURES.map(({ key, label }) => (
          <Check
            key={key}
            label={label}
            checked={features[key]}
            onChange={(e) => onChange(key, e.target.checked)}
          />
        ))}
      </div>
    </Section>
  );
}
