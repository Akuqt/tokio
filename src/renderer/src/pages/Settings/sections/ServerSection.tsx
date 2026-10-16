import { Check, Section } from "@/components";
import { FiMonitor } from "react-icons/fi";

interface Props {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

export function ServerSection({ enabled, onChange }: Props) {
  return (
    <Section
      icon={<FiMonitor />}
      title="Overlay Server"
      description="Configure the local web server used for overlays."
    >
      <Check
        label="Enable Server"
        checked={enabled}
        onChange={(e) => onChange(e.target.checked)}
      />
    </Section>
  );
}
