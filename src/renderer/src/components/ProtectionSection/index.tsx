import { Profile } from "@/common/schemas";
import { Updater } from "@/hooks/useImmerState";
import { ReactNode } from "react";
import { Input } from "../Elements";
import { Field, FormGrid, Section } from "../Page";

// Limits shared by the TTS and Music settings
type Protection = Pick<
  Profile["music"]["protection"],
  "cooldown" | "queue_length"
>;

interface Props {
  protection: Protection;
  update: Updater<Protection>;
  // Feature name shown in the description
  feature: "TTS" | "Music";
  // More fields, after the shared ones
  children?: ReactNode;
}

export function ProtectionSection({
  protection,
  update,
  feature,
  children,
}: Props) {
  return (
    <Section
      title="Protection"
      description={`Set limits and word filters to prevent chat from abusing the ${feature} system.`}
    >
      <FormGrid>
        <Field label="Cooldown" hint="(seconds)">
          <Input
            type="number"
            value={protection.cooldown}
            onChange={(e) =>
              update((p) => {
                p.cooldown = Number(e.target.value);
              })
            }
          />
        </Field>
        <Field label="Max Queue Length">
          <Input
            type="number"
            value={protection.queue_length}
            onChange={(e) =>
              update((p) => {
                p.queue_length = Number(e.target.value);
              })
            }
          />
        </Field>
      </FormGrid>
      {children}
    </Section>
  );
}
