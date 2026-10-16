import { Btn } from "@/components/Elements";
import { Modal } from "@/components/Modal";
import React, {
  createContext,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";

// A page with settings that are edited and then saved by hand.
export interface UnsavedEditor {
  // Shown in the prompt, e.g. "TTS"
  label: string;
  isDirty: () => boolean;
  // Resolves whether the save succeeded
  save: () => Promise<boolean>;
  discard: () => void;
}

export interface UnsavedContextType {
  // Returns the function that unregisters the editor
  register: (editor: UnsavedEditor) => () => void;
  /**
   * Asks the user what to do with unsaved changes before they would be lost.
   * Resolves true when it's fine to go on (saved, discarded or nothing to
   * save), false when the user cancels.
   */
  confirmDiscard: () => Promise<boolean>;
}

export const UnsavedContext = createContext<UnsavedContextType | null>(null);

type Prompt = { label: string; resolve: (proceed: boolean) => void };

export function UnsavedProvider({ children }: { children: React.ReactNode }) {
  const editorRef = useRef<UnsavedEditor | null>(null);
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [saving, setSaving] = useState(false);

  const register = useCallback((editor: UnsavedEditor) => {
    editorRef.current = editor;
    return () => {
      if (editorRef.current === editor) editorRef.current = null;
    };
  }, []);

  const confirmDiscard = useCallback(() => {
    const editor = editorRef.current;
    if (!editor?.isDirty()) return Promise.resolve(true);
    return new Promise<boolean>((resolve) =>
      setPrompt({ label: editor.label, resolve }),
    );
  }, []);

  const finish = (proceed: boolean) => {
    prompt?.resolve(proceed);
    setPrompt(null);
  };

  const value = useMemo(
    () => ({ register, confirmDiscard }),
    [register, confirmDiscard],
  );

  return (
    <UnsavedContext.Provider value={value}>
      {children}
      {prompt && (
        <Modal
          title="Unsaved changes"
          description={`You have unsaved ${prompt.label} settings. Save them before continuing?`}
          onClose={() => finish(false)}
          footer={
            <>
              <Btn onClick={() => finish(false)}>Cancel</Btn>
              <Btn
                onClick={() => {
                  editorRef.current?.discard();
                  finish(true);
                }}
              >
                Discard
              </Btn>
              <Btn
                variant="accent"
                loading={saving}
                onClick={async () => {
                  setSaving(true);
                  const saved = (await editorRef.current?.save()) ?? true;
                  setSaving(false);
                  if (saved) finish(true);
                }}
              >
                Save
              </Btn>
            </>
          }
        />
      )}
    </UnsavedContext.Provider>
  );
}
