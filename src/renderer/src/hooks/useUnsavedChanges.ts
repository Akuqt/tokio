import { UnsavedContext, UnsavedContextType } from "@/context/unsaved";
import { useContext } from "react";

export function useUnsavedChanges(): UnsavedContextType {
  const context = useContext(UnsavedContext);
  if (!context) {
    throw new Error("useUnsavedChanges must be used within an UnsavedProvider");
  }
  return context;
}
