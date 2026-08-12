import { ServiceProviderContext } from "@renderer/context";
import { useContext } from "react";

export function useServices() {
  const context = useContext(ServiceProviderContext);
  if (context === undefined) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
}
