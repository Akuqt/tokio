import { OverlayConfig, OverlayConfigField } from "@/common/schemas";
import { CustomGift } from "@/common/types";
import { memo, useEffect, useState } from "react";
import { VscClose } from "react-icons/vsc";
import { MoonLoader } from "react-spinners";
import { Btn, Check, Color, Input, Select, Slider, Toggle } from "../Elements";
import styles from "./overlaymodal.module.css";

interface Props {
  config: OverlayConfig | null;
  gifts: CustomGift[];
  onRequestClose: () => void;
  onSave: (config: OverlayConfig) => void;
  onReset: () => void;
}

export const OverlayModal = memo(
  ({ config, gifts, onRequestClose, onReset, onSave }: Props) => {
    const [settings, setSettings] = useState<OverlayConfig | null>(config);

    useEffect(() => {
      setSettings(config);
    }, [config]);

    const handleValueChange = (id: string, newValue: any) => {
      setSettings((prev) => {
        if (prev == null) return prev;
        return {
          ...prev,
          fields: prev.fields.map((field) =>
            field.id === id
              ? {
                  ...field,
                  attributes: {
                    ...field.attributes,
                    value: newValue,
                  },
                }
              : field,
          ) as OverlayConfigField[],
        };
      });
    };

    const renderInput = (field: OverlayConfigField) => {
      switch (field.type) {
        case "input":
          return (
            <Input
              type={field.attributes.mode}
              placeholder={field.attributes.placeholder}
              value={field.attributes.value}
              bgColor={{
                primary: "var(--background-secondary)",
                secondary: "var(--background-primary)",
              }}
              textColor="var(--font-primary)"
              onChange={(e) => {
                const rawValue = e.target.value;
                const finalValue =
                  field.attributes.mode === "number"
                    ? Number(rawValue)
                    : rawValue;

                handleValueChange(field.id, finalValue);
              }}
            />
          );

        case "dropdown":
          return (
            <Select
              multiple={field.attributes.multiple}
              searchable={field.attributes.searchable}
              labelColor={{
                active: "var(--font-primary)",
                passive: "var(--font-secondary)",
              }}
              bgColor={{
                active: "var(--background-secondary)",
                passive: "var(--background-primary)",
              }}
              value={field.attributes.value}
              onChange={(val) => handleValueChange(field.id, val)}
              options={field.attributes.options}
            />
          );

        case "color":
          return (
            <Color
              bgColor="var(--background-primary)"
              txtColor="var(--font-primary)"
              value={`#${field.attributes.value}`}
              borderColor="var(--background-primary)"
              onChange={(val: any) => {
                const rawValue =
                  typeof val === "string" ? val : val.target.value;
                handleValueChange(field.id, rawValue.replace(/^#/, ""));
              }}
            />
          );

        case "slider":
          return (
            <Slider
              bgColor="var(--background-primary)"
              min={field.attributes.min}
              max={field.attributes.max}
              value={field.attributes.value}
              onChange={(val) => {
                handleValueChange(field.id, val);
              }}
              showValue
            />
          );

        case "check":
          return (
            <Check
              checked={field.attributes.value}
              onChange={(e) => {
                handleValueChange(field.id, e.target.checked);
              }}
            />
          );

        case "toggle":
          return (
            <Toggle
              bgColor="var(--background-primary)"
              checked={field.attributes.value}
              onChange={(e) => {
                handleValueChange(field.id, e.target.checked);
              }}
            />
          );

        case "gifts":
          return (
            <Select
              searchable
              multiple={field.attributes.multiple}
              labelColor={{
                active: "var(--font-primary)",
                passive: "var(--font-secondary)",
              }}
              bgColor={{
                active: "var(--background-secondary)",
                passive: "var(--background-primary)",
              }}
              value={field.attributes.value}
              onChange={(val) => handleValueChange(field.id, val)}
              options={gifts}
            />
          );

        default:
          return null;
      }
    };
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.modal_header}>
            <h3 className={styles.title}>Overlay Settings</h3>
            <button className={styles.close} onClick={onRequestClose}>
              <VscClose size={30} />
            </button>
          </div>
          <div className={styles.settings}>
            {settings == null ? (
              <div className={styles.loading}>
                <MoonLoader color="var(--accent-primary)" size={100} />
              </div>
            ) : (
              <div className={styles.config_container}>
                {settings.sections.map((section) => (
                  <fieldset key={section.id} className={styles.field_group}>
                    <legend>
                      <h2 style={{ paddingLeft: 14, fontWeight: 500 }}>
                        {section.name}
                      </h2>
                    </legend>

                    {settings.fields
                      .filter((s) => s.section === section.id)
                      .map((field) => (
                        <div key={field.id} className={styles.field}>
                          <label className={styles.field_label}>
                            {field.name}
                          </label>
                          <div className={styles.field_input}>
                            {renderInput(field)}
                          </div>
                        </div>
                      ))}
                  </fieldset>
                ))}
              </div>
            )}
          </div>
          <div className={styles.btns}>
            <Btn
              textColor="var(--font-primary)"
              bgColor={{
                primary: "var(--background-secondary)",
                secondary: "var(--background-primary)",
              }}
              onClick={() => {
                if (settings != null) onReset();
              }}
            >
              Reset
            </Btn>
            <Btn
              textColor="var(--font-primary)"
              bgColor={{
                primary: "var(--background-secondary)",
                secondary: "var(--background-primary)",
              }}
              onClick={() => {
                if (settings != null) onSave(settings);
              }}
            >
              Save
            </Btn>
          </div>
        </div>
      </div>
    );
  },
);
