import { APP_EVENTS_RESPONSE, AppNotification } from "@/common/types";
import { Toasts } from "@/components/Toasts";
import { useIpcListener } from "@/hooks/useIpcListener";
import React, { createContext, useCallback, useMemo, useState } from "react";

// Notices kept for the bell, this session only
const HISTORY_LIMIT = 50;
// Older toasts leave the screen, they stay in the history
const MAX_TOASTS = 4;

export interface NotificationsContextType {
  // Newest first
  history: AppNotification[];
  // Notices that arrived since the bell was last opened
  unread: number;
  unreadError: boolean;
  dismiss: (id: string) => void;
  markSeen: () => void;
  clear: () => void;
}

export const NotificationsContext =
  createContext<NotificationsContextType | null>(null);

/**
 * Keeps the notices main sends and shows them as toasts. Mounted above the
 * splash screen, so notices sent while the app loads aren't lost.
 */
export function NotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [history, setHistory] = useState<AppNotification[]>([]);
  // Ids on screen, newest last
  const [toasts, setToasts] = useState<string[]>([]);
  // Timestamp of the newest notice when the bell was last opened
  const [lastSeen, setLastSeen] = useState(0);

  useIpcListener(APP_EVENTS_RESPONSE.NOTIFY, (notification) => {
    if (!notification) return;
    setHistory((h) => [notification, ...h].slice(0, HISTORY_LIMIT));
    setToasts((t) => [...t, notification.id].slice(-MAX_TOASTS));
  });

  const dismiss = useCallback((id: string) => {
    setToasts((t) => t.filter((toast) => toast !== id));
  }, []);

  const markSeen = useCallback(() => {
    setLastSeen(history[0]?.timestamp ?? 0);
  }, [history]);

  const clear = useCallback(() => {
    setHistory([]);
    setToasts([]);
  }, []);

  const value = useMemo(() => {
    const unread = history.filter((n) => n.timestamp > lastSeen);
    return {
      history,
      unread: unread.length,
      unreadError: unread.some((n) => n.level === "error"),
      dismiss,
      markSeen,
      clear,
    };
  }, [history, lastSeen, dismiss, markSeen, clear]);

  const visible = useMemo(
    () => history.filter((n) => toasts.includes(n.id)).reverse(),
    [history, toasts],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
      <Toasts toasts={visible} onDismiss={dismiss} />
    </NotificationsContext.Provider>
  );
}
