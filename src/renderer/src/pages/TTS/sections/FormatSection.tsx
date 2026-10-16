import { Profile } from "@/common/schemas";
import { Field, Input, RadioGroup, Section } from "@/components";
import { Updater } from "@/hooks";
import styles from "../tts.module.css";

type Format = Profile["tts"]["format"];
type Mode = Format["trigger"]["mode"];

// Prefix each mode starts with
const MODE_VALUES: Record<Mode, string> = {
  any: "",
  dot: ".",
  slash: "/",
  custom: "",
};

interface Props {
  format: Format;
  update: Updater<Format>;
}

export function FormatSection({ format, update }: Props) {
  const custom = format.trigger.mode === "custom";

  return (
    <Section
      title="Format"
      description="Determine which chat messages get read aloud."
    >
      <RadioGroup
        name="trigger"
        value={format.trigger.mode}
        onChange={(mode) =>
          update((f) => {
            f.trigger = { mode, value: MODE_VALUES[mode] };
          })
        }
        options={[
          {
            value: "any",
            label: "Read All Comments",
            description:
              "Every single message in chat will be processed by TTS.",
          },
          {
            value: "dot",
            label: "Dot Prefix ( . )",
            description: "Only messages starting with a period will be read.",
          },
          {
            value: "slash",
            label: "Slash Prefix ( / )",
            description:
              "Only messages starting with a forward slash will be read.",
          },
          {
            value: "custom",
            label: (
              <>
                Custom Command
                <Input
                  className={styles.trigger_input}
                  placeholder="!tts"
                  value={custom ? format.trigger.value : ""}
                  disabled={!custom}
                  onChange={(e) =>
                    update((f) => {
                      f.trigger.value = e.target.value;
                    })
                  }
                />
              </>
            ),
            description:
              "Only messages starting with this exact phrase will be read.",
          },
        ]}
      />

      <Field label="Message Template">
        <Input
          value={format.template}
          onChange={(e) =>
            update((f) => {
              f.template = e.target.value;
            })
          }
        />
        <p className={styles.hint}>
          Variables: {"{username}"}, {"{nickname}"}, {"{comment}"}
        </p>
      </Field>
    </Section>
  );
}
