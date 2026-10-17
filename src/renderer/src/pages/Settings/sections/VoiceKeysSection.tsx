import { APP_EVENTS, APP_EVENTS_RESPONSE, VoiceEngine } from "@/common/types";
import { Btn, Field, FormGrid, Input, Section } from "@/components";
import { useIpcListener, useIpcRequest } from "@/hooks";
import { useState } from "react";
import { FiKey, FiSave } from "react-icons/fi";
import styles from "../settings.module.css";

type EngineKey = VoiceEngine & { key: string };

// Keys for the voice engines that take one. Hidden when none does.
export function VoiceKeysSection() {
  const [engines, setEngines] = useState<EngineKey[]>([]);

  useIpcRequest(APP_EVENTS.GET_VOICE_KEYS);

  useIpcListener(APP_EVENTS_RESPONSE.GET_VOICE_KEYS, (res) => {
    if (res?.success) setEngines(res.engines!);
  });

  if (engines.length === 0) return null;

  return (
    <Section
      icon={<FiKey />}
      title="Voice Engines"
      description="Keys for the voice engines used by TTS."
    >
      <FormGrid>
        {engines.map((engine) => (
          <KeyForm key={engine.id} engine={engine} />
        ))}
      </FormGrid>
    </Section>
  );
}

function KeyForm({ engine }: { engine: EngineKey }) {
  const [key, setKey] = useState(engine.key);
  const [prevKey, setPrevKey] = useState(engine.key);

  // Start over from the saved key when it changes.
  if (engine.key !== prevKey) {
    setPrevKey(engine.key);
    setKey(engine.key);
  }

  return (
    <div className={styles.provider}>
      <Field
        label={`${engine.label} voices`}
        hint={`(${engine.keyLabel}, optional)`}
      >
        <Input
          type="password"
          placeholder={`${engine.label} ${engine.keyLabel}...`}
          value={key}
          onChange={(e) => setKey(e.target.value)}
        />
      </Field>
      <Btn
        className={styles.provider_save}
        disabled={key === engine.key}
        onClick={() =>
          window.api.emit(APP_EVENTS.SET_VOICE_KEY, { engine: engine.id, key })
        }
      >
        <FiSave /> Save
      </Btn>
    </div>
  );
}
