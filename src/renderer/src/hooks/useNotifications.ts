import {
  NotificationsContext,
  NotificationsContextType,
} from "@/context/notifications";
import { useContext } from "react";

export function useNotifications(): NotificationsContextType {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationsProvider",
    );
  }
  return context;
}
