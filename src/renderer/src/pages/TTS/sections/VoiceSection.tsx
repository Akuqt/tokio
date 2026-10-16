import { Profile } from "@/common/schemas";
import { VoiceData } from "@/common/types";
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
  testLoading: boolean;
  testQueue: AudioQueue;
  update: Updater<Settings>;
  onTest: (text: string) => void;
}

const voiceKey = (voice: VoiceData) => `${voice.lang}|${voice.name}`;

// Voices grouped by language, in the order the languages first appear.
function voiceOptions(voices: VoiceData[]): SelectOption<string>[] {
  const groups = new Map<string, VoiceData[]>();
  for (const voice of voices) {
    groups.set(voice.lang, [...(groups.get(voice.lang) ?? []), voice]);
  }
  return [...groups.values()].flat().map((voice) => ({
    value: voiceKey(voice),
    label: voice.name,
    group: voice.lang,
  }));
}

export function VoiceSection({
  settings,
  voices,
  testLoading,
  testQueue,
  update,
  onTest,
}: Props) {
  const [testMessage, setTestMessage] = useState("");
  const options = useMemo(() => voiceOptions(voices), [voices]);
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
