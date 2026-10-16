import { AboutInfo, APP_EVENTS, APP_EVENTS_RESPONSE } from "@/common/types";
import { Page } from "@/components";
import { useIpcListener, useIpcRequest } from "@/hooks";
import { useState } from "react";
import { AppSection } from "./sections/AppSection";
import { ComponentsSection } from "./sections/ComponentsSection";
import { LicenseModal } from "./sections/LicenseModal";
import { PackagesSection } from "./sections/PackagesSection";
import { ServicesSection } from "./sections/ServicesSection";

export function About() {
  const [about, setAbout] = useState<AboutInfo | null>(null);
  const [failed, setFailed] = useState(false);
  // Document or package whose license is shown
  const [viewing, setViewing] = useState<string | null>(null);

  useIpcRequest(APP_EVENTS.GET_ABOUT);

  useIpcListener(APP_EVENTS_RESPONSE.GET_ABOUT, (res) => {
    if (!res) return;
    setAbout(res.data ?? null);
    setFailed(!res.success);
  });

  return (
    <>
      {viewing && (
        <LicenseModal
          id={viewing}
          onClose={() => setViewing(null)}
          onView={setViewing}
        />
      )}

      <Page>
        <AppSection versions={about?.versions} onView={setViewing} />
        <ComponentsSection onView={setViewing} />
        <PackagesSection
          packages={about?.packages}
          failed={failed}
          onView={setViewing}
        />
        <ServicesSection />
      </Page>
    </>
  );
}
