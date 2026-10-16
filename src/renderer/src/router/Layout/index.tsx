import Logo from "@/assets/logo.png";
import { EntityMetadata } from "@/common/schemas";
import { APP_EVENTS, APP_EVENTS_RESPONSE } from "@/common/types";
import { NotificationBell, ProfileDropdown } from "@/components";
import {
  useAudio,
  useIpcListener,
  useIpcRequest,
  useNotifications,
  useUnsavedChanges,
} from "@/hooks";
import { TitleBar } from "@/ui/TitleBar";
import { Link, Outlet, useBlocker } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BsLightningCharge } from "react-icons/bs";
import {
  FiHome,
  FiInfo,
  FiMusic,
  FiSettings,
  FiTool,
  FiVolume2,
} from "react-icons/fi";
import { LuMonitorCog } from "react-icons/lu";
import styles from "./layout.module.css";

const NAV_ITEMS = [
  { to: "/", label: "Home", icon: <FiHome size={22} /> },
  { to: "/overlays", label: "Overlays", icon: <LuMonitorCog size={22} /> },
  { to: "/tts", label: "TTS", icon: <FiVolume2 size={22} /> },
  { to: "/alerts", label: "Alerts", icon: <BsLightningCharge size={24} /> },
  { to: "/music", label: "Music", icon: <FiMusic size={22} /> },
  // Pinned to the bottom of the sidebar from here on
  { to: "/tools", label: "Tools", icon: <FiTool size={22} />, bottom: true },
  { to: "/settings", label: "Settings", icon: <FiSettings size={22} /> },
  // Shows the license notices the AGPL requires, keep it in the sidebar
  { to: "/about", label: "About", icon: <FiInfo size={22} /> },
] as const;

export function Layout() {
  const { resumeContext } = useAudio();
  const { confirmDiscard } = useUnsavedChanges();
  const notifications = useNotifications();

  const [isConnected, setIsConnected] = useState(false);
  const [profiles, setProfiles] = useState<EntityMetadata[]>([]);
  const [activeProfile, setActiveProfile] = useState<EntityMetadata>({
    file: "",
    name: "",
  });

  useIpcRequest(APP_EVENTS.GET_SETTINGS);

  useIpcListener(APP_EVENTS_RESPONSE.GET_SETTINGS, (res) => {
    if (!res?.success) return;
    setProfiles(res.data!.profiles);
    setActiveProfile(res.data!.settings.activeProfile);
  });

  useIpcListener(APP_EVENTS_RESPONSE.CONNECTED, (res) => {
    if (res) setIsConnected(res.success);
  });

  useEffect(() => {
    resumeContext();
  }, [resumeContext]);

  // Leaving a page with unsaved settings asks first. Only in-app navigation:
  // blocking beforeunload makes Electron refuse to close or reload the window.
  useBlocker({
    shouldBlockFn: async () => !(await confirmDiscard()),
    enableBeforeUnload: false,
  });

  return (
    <div className={styles.container}>
      <TitleBar target="main" logo={Logo}>
        <ProfileDropdown
          disabled={isConnected}
          profiles={profiles}
          active={activeProfile}
          onProfileSelected={async (file) => {
            if (await confirmDiscard()) {
              window.api.emit(APP_EVENTS.SET_PROFILE, { file });
            }
          }}
        />
        <NotificationBell
          history={notifications.history}
          unread={notifications.unread}
          unreadError={notifications.unreadError}
          onSeen={notifications.markSeen}
          onClear={notifications.clear}
        />
      </TitleBar>

      <div className={styles.main_area}>
        <nav className={styles.sidebar}>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`${styles.sidebar_item} ${
                "bottom" in item ? styles.sidebar_item_bottom : ""
              }`}
              activeProps={{ className: styles.sidebar_item_active }}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
