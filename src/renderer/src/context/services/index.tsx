import { ServiceAppProvider } from "@/common/types";
import React, { createContext, useEffect, useState } from "react";

export interface ServicesContextType {
  services: ServiceAppProvider[];
  changeServices: (
    name: string,
    type: "tts" | "connector",
    key?: string,
  ) => void;
  getVoices: () => void;
  servicesLoading: boolean;
}

const defaultServices: ServiceAppProvider[] = [
  { name: "TikTok", type: "tts", active: true },
  { name: "TikTok", type: "connector", active: true },
];

export const ServicesContext = createContext<ServicesContextType | undefined>(
  undefined,
);

export function ServicesProvider({ children }: { children: React.ReactNode }) {
  const [services, setServices] = useState<ServiceAppProvider[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);

  useEffect(() => {
    if (!window.api) {
      setServices(defaultServices);
      setServicesLoading(false);
      return;
    }

    window.api.onGetServices((response) => {
      let servicesToApply = defaultServices;
      if (response.success && response.services) {
        servicesToApply = response.services;
      } else {
        console.warn(
          "Failed to load services from main, using default fallback.",
        );
      }
      setServices(servicesToApply);
      setServicesLoading(false);
    });

    window.api.getServices();
  }, []);

  const changeServices = (
    name: string,
    type: "tts" | "connector",
    key?: string,
  ) => {
    if (!services.find((p) => p.name === name)) return;
    window.api.setServices(name, type, key);
  };

  const getVoices = () => {
    window.api.getVoices();
  };

  return (
    <ServicesContext.Provider
      value={{ services, changeServices, servicesLoading, getVoices }}
    >
      {servicesLoading ? (
        <div style={{ background: "#000", height: "100vh" }} /> // TODO: Handle Load later
      ) : (
        children
      )}
    </ServicesContext.Provider>
  );
}
