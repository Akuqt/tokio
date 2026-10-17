import { Profile } from "@/common/schemas";
import { VoiceData, VoiceEngine } from "@/common/types";
import {
  Btn,
  Field,
  FormGrid,
  Input,
  Section,
  Select,
  SelectOption,
  Slider,
} from "@/components";
import { AudioQueue } from "@/helper";
import { Updater } from "@/hooks";
import { useMemo, useState } from "react";
import styles from "../tts.module.css";

type Settings = Profile["tts"];

interface Props {
  settings: Settings;
  voices: VoiceData[];
  engines: VoiceEngine[];
  testLoading: boolean;
  testQueue: AudioQueue;
  update: Updater<Settings>;
  onTest: (text: string) => void;
}

const voiceKey = (voice: VoiceData) =>
  `${voice.engine}|${voice.lang}|${voice.name}`;

// Voices grouped by engine and language, in the order the groups first appear.
function voiceOptions(
  voices: VoiceData[],
  engines: VoiceEngine[],
): SelectOption<string>[] {
  const labels = new Map(engines.map((e) => [e.id, e.label]));
  const groups = new Map<string, SelectOption<string>[]>();
  for (const voice of voices) {
    const group = `${labels.get(voice.engine) ?? voice.engine} · ${voice.lang}`;
    const options = groups.get(group) ?? [];
    options.push({ value: voiceKey(voice), label: voice.name, group });
    groups.set(group, options);
  }
  return [...groups.values()].flat();
}

export function VoiceSection({
  settings,
  voices,
  engines,
  testLoading,
  testQueue,
  update,
  onTest,
}: Props) {
  const [testMessage, setTestMessage] = useState("");
  const options = useMemo(
    () => voiceOptions(voices, engines),
    [voices, engines],
  );
  const { filters } = settings;

  return (
    <Section
      title="Voice"
      description="Configure the primary Text-to-Speech voice for your stream."
    >
      <FormGrid>
        <Field label="Voice Selection">
          <Select
            searchable
            options={options}
            value={voiceKey(settings.voice)}
            placeholder={`${settings.voice.lang} - ${settings.voice.name}`}
            onChange={(key) => {
              const voice = voices.find((v) => voiceKey(v) === key);
              if (voice)
                update((s) => {
                  s.voice = voice;
                });
            }}
          />
        </Field>

        <Field label={`Speed (${filters.speed}x)`}>
          <Slider
            min={0.5}
            max={2}
            step={0.1}
            value={filters.speed}
            onChange={(speed) => {
              update((s) => {
                s.filters.speed = speed;
              });
              testQueue.setFilters({ speed });
            }}
          />
        </Field>

        <Field label={`Pitch (${filters.pitch})`}>
          <Slider
            min={0.5}
            max={2}
            step={0.1}
            value={filters.pitch}
            onChange={(pitch) => {
              update((s) => {
                s.filters.pitch = pitch;
              });
              testQueue.setFilters({ pitch });
            }}
          />
        </Field>

        <Field label={`Volume (${filters.volume}%)`}>
          <Slider
            min={0}
            max={100}
            value={filters.volume}
            onChange={(volume) => {
              update((s) => {
                s.filters.volume = volume;
              });
              testQueue.setFilters({ volume: volume / 100 });
            }}
          />
        </Field>
      </FormGrid>

      <div className={styles.tester}>
        <Btn
          variant="accent"
          className={styles.tester_btn}
          loading={testLoading}
          disabled={testMessage === ""}
          onClick={() => onTest(testMessage)}
        >
          Test Voice
        </Btn>
        <Input
          placeholder="Type a message to test how the TTS sounds..."
          value={testMessage}
          onChange={(e) => setTestMessage(e.target.value)}
        />
      </div>
    </Section>
  );
}
