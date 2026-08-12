import { APP_EVENTS, ServiceAppProvider } from "@/common/types";
import React, { createContext, useEffect, useState } from "react";

export interface ServiceProviderContextType {
  services: ServiceAppProvider[];
  changeServiceProvider: (
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

export const ServiceProviderContext = createContext<
  ServiceProviderContextType | undefined
>(undefined);

export function ServiceProvider({ children }: { children: React.ReactNode }) {
  const [services, setServices] = useState<ServiceAppProvider[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);

  useEffect(() => {
    if (!window.api) {
      setServices(defaultServices);
      setServicesLoading(false);
      return;
    }

    const removeGetServices = window.api.on(
      APP_EVENTS.RES_GET_SERVICE_PROVIDERS,
      (response) => {
        let servicesToApply = defaultServices;
        if (response?.success && response.services) {
          servicesToApply = response.services;
        } else {
          console.warn(
            "Failed to load services from main, using default fallback.",
          );
        }
        setServices(servicesToApply);
        setServicesLoading(false);
      },
    );

    window.api.emit(APP_EVENTS.GET_SERVICE_PROVIDERS);

    return () => {
      removeGetServices();
    };
  }, []);

  const changeServiceProvider = (
    name: string,
    type: "tts" | "connector",
    key?: string,
  ) => {
    if (!services.find((p) => p.name === name)) return;
    window.api.emit(APP_EVENTS.SET_SERVICE_PROVIDER, { name, type, key });
  };

  const getVoices = () => {
    window.api.emit(APP_EVENTS.GET_VOICES);
  };

  return (
    <ServiceProviderContext.Provider
      value={{ services, changeServiceProvider, servicesLoading, getVoices }}
    >
      {servicesLoading ? (
        <div style={{ background: "#000", height: "100vh" }} /> // TODO: Handle Load later
      ) : (
        children
      )}
    </ServiceProviderContext.Provider>
  );
}
