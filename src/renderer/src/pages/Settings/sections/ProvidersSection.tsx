import { AppProvider, AppSettings } from "@/common/schemas";
import { APP_EVENTS } from "@/common/types";
import { Btn, Field, FormGrid, Input, Section, Select } from "@/components";
import { useState } from "react";
import { FiBox, FiSave } from "react-icons/fi";
import styles from "../settings.module.css";

interface Props {
  settings: AppSettings;
}

// Only shown when there's more than one connector to choose from.
export function ProvidersSection({ settings }: Props) {
  return (
    <Section
      icon={<FiBox />}
      title="Providers"
      description="Configure the backend service used for TikTok events."
    >
      <FormGrid>
        <ProviderForm
          type="connector"
          label="TikTok Events"
          providers={settings.providers.connector}
          active={settings.activeConnProvider}
        />
      </FormGrid>
    </Section>
  );
}

interface FormProps {
  type: "connector";
  label: string;
  providers: AppProvider[];
  active: AppProvider;
}

function ProviderForm({ type, label, providers, active }: FormProps) {
  const [name, setName] = useState(active.name);
  const [key, setKey] = useState(active.key);
  const [prevActive, setPrevActive] = useState(active);

  // Start over from the saved provider when it changes.
  if (active !== prevActive) {
    setPrevActive(active);
    setName(active.name);
    setKey(active.key);
  }

  return (
    <div className={styles.provider}>
      <Field label={label}>
        <Select
          options={providers.map((p) => ({ label: p.name, value: p.name }))}
          value={name}
          onChange={setName}
        />
      </Field>
      <Field label="Key" hint="(Optional)">
        <Input
          type="password"
          placeholder="Provider key..."
          value={key}
          onChange={(e) => setKey(e.target.value)}
        />
      </Field>
      <Btn
        className={styles.provider_save}
        onClick={() =>
          window.api.emit(APP_EVENTS.SET_PROVIDER, { name, key, type })
        }
      >
        <FiSave /> Save
      </Btn>
    </div>
  );
}
