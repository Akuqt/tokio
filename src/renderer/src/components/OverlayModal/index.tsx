import {
  OverlayConfig,
  OverlayConfigField,
  resetOverlayConfig,
} from "@/common/schemas";
import { CustomGift } from "@/common/types";
import { memo, useState } from "react";
import { MoonLoader } from "react-spinners";
import {
  Btn,
  Check,
  Color,
  Input,
  MultiSelect,
  Select,
  Slider,
  Toggle,
} from "../Elements";
import { Modal } from "../Modal";
import styles from "./overlaymodal.module.css";

interface Props {
  config: OverlayConfig | null;
  gifts: CustomGift[];
  onRequestClose: () => void;
  onSave: (config: OverlayConfig) => void;
}

type Value = string | number;

// Dropdown values are stored as one value or a list, depending on `multiple`.
function asList<V extends Value>(value: V | V[]): V[] {
  return Array.isArray(value) ? value : [value];
}

function asSingle<V extends Value>(value: V | V[]): V | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export const OverlayModal = memo(
  ({ config, gifts, onRequestClose, onSave }: Props) => {
    const [settings, setSettings] = useState<OverlayConfig | null>(config);
    const [prevConfig, setPrevConfig] = useState(config);

    // Load the config once it arrives.
    if (config !== prevConfig) {
      setPrevConfig(config);
      setSettings(config);
    }

    const handleValueChange = (id: string, value: unknown) => {
      setSettings((prev) => {
        if (prev == null) return prev;
        return {
          ...prev,
          fields: prev.fields.map((field) =>
            field.id === id
              ? { ...field, attributes: { ...field.attributes, value } }
              : field,
          ) as OverlayConfigField[],
        };
      });
    };

    const renderInput = (field: OverlayConfigField) => {
      const onChange = (value: unknown) => handleValueChange(field.id, value);

      switch (field.type) {
        case "input":
          return (
            <Input
              type={field.attributes.mode}
              placeholder={field.attributes.placeholder}
              value={field.attributes.value}
              onChange={(e) =>
                onChange(
                  field.attributes.mode === "number"
                    ? Number(e.target.value)
                    : e.target.value,
                )
              }
            />
          );

        case "dropdown":
          return field.attributes.multiple ? (
            <MultiSelect
              searchable={field.attributes.searchable}
              options={field.attributes.options}
              value={asList<Value>(field.attributes.value)}
              onChange={onChange}
            />
          ) : (
            <Select
              searchable={field.attributes.searchable}
              options={field.attributes.options}
              value={asSingle<Value>(field.attributes.value)}
              onChange={onChange}
            />
          );

        case "gifts":
          return field.attributes.multiple ? (
            <MultiSelect
              searchable
              options={gifts}
              value={asList(field.attributes.value)}
              onChange={onChange}
            />
          ) : (
            <Select
              searchable
              options={gifts}
              value={asSingle(field.attributes.value)}
              onChange={onChange}
            />
          );

        case "color":
          return (
            <Color
              value={`#${field.attributes.value}`}
              onChange={(color) => onChange(color.replace(/^#/, ""))}
            />
          );

        case "slider":
          return (
            <Slider
              min={field.attributes.min}
              max={field.attributes.max}
              value={field.attributes.value}
              onChange={onChange}
              showValue
            />
          );

        case "check":
          return (
            <Check
              checked={field.attributes.value}
              onChange={(e) => onChange(e.target.checked)}
            />
          );

        case "toggle":
          return (
            <Toggle
              checked={field.attributes.value}
              onChange={(e) => onChange(e.target.checked)}
            />
          );

        default:
          return null;
      }
    };

    return (
      <Modal
        title="Overlay Settings"
        maxWidth="500px"
        closeButton
        onClose={onRequestClose}
        footer={
          <div className={styles.footer}>
            <Btn
              disabled={settings == null}
              onClick={() =>
                setSettings((prev) =>
                  prev == null ? prev : resetOverlayConfig(prev),
                )
              }
            >
              Reset
            </Btn>
            <Btn
              variant="accent"
              disabled={settings == null}
              onClick={() => {
                if (settings != null) onSave(settings);
              }}
            >
              Save
            </Btn>
          </div>
        }
      >
        {settings == null ? (
          <div className={styles.loading}>
            <MoonLoader color="var(--accent-primary)" size={100} />
          </div>
        ) : (
          <div className={styles.settings}>
            {settings.sections.map((section) => (
              <fieldset key={section.id} className={styles.group}>
                <legend className={styles.group_name}>{section.name}</legend>

                {settings.fields
                  .filter((field) => field.section === section.id)
                  .map((field) => (
                    <div key={field.id} className={styles.field}>
                      <label className={styles.field_label}>{field.name}</label>
                      {renderInput(field)}
                    </div>
                  ))}
              </fieldset>
            ))}
          </div>
        )}
      </Modal>
    );
  },
);
