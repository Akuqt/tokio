import { FiArrowRight, FiPlus, FiTrash2 } from "react-icons/fi";
import { TTSAction, TTSState } from "../helper";
import styles from "../tts.module.css";

interface Props {
  replacements: TTSState["settings"]["replacements"];
  dispatch: React.Dispatch<TTSAction>;
}

export function ReplacementsSection({ replacements, dispatch }: Props) {
  return (
    <div className={styles.replacement_container}>
      <div className={styles.replacement_header}>
        <div>
          <h2 className={styles.section_header}>Replacements</h2>
          <p className={styles.section_description}>
            Force the engine to pronounce acronyms or slang correctly.
          </p>
        </div>
        <button
          onClick={() =>
            dispatch({
              type: "AddReplacements",
              payload: { old: "", new: "" },
            })
          }
          className={styles.replacement_add_btn}
          title="Add Replacement"
        >
          <FiPlus size={24} />
        </button>
      </div>

      <div className={styles.replacement_section}>
        {replacements.map((replacement, index) => (
          <div key={index} className={styles.replacement_section_item}>
            <input
              type="text"
              className={styles.input_style}
              placeholder="Word to replace (e.g. 'brb')"
              style={{ flex: 1 }}
              value={replacement.old}
              onChange={(e) => {
                const newCustom = [...replacements];
                newCustom[index] = {
                  ...newCustom[index],
                  old: e.target.value,
                };
                dispatch({ type: "setReplacements", payload: newCustom });
              }}
            />
            <span className={styles.replacement_section_item_sep}>
              <FiArrowRight size={16} />
            </span>
            <input
              type="text"
              className={styles.input_style}
              placeholder="How it sounds (e.g. 'be right back')"
              style={{ flex: 1 }}
              value={replacement.new}
              onChange={(e) => {
                const newCustom = [...replacements];
                newCustom[index] = {
                  ...newCustom[index],
                  new: e.target.value,
                };
                dispatch({ type: "setReplacements", payload: newCustom });
              }}
            />
            <button
              onClick={() => {
                const newCustom = replacements.filter((_, i) => i !== index);
                dispatch({ type: "setReplacements", payload: newCustom });
              }}
              className={styles.replacement_remove_btn}
              title="Remove"
            >
              <FiTrash2 size={18} />
            </button>
          </div>
        ))}

        {replacements.length === 0 && (
          <div className={styles.replacement_empty_list}>
            No custom replacements added.
          </div>
        )}
      </div>
    </div>
  );
}
