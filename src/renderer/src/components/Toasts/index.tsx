import { AppNotification, FeedbackLevel } from "@/common/types";
import { cx } from "@/helper/cx";
import { useEffect, useRef, useState } from "react";
import { IconType } from "react-icons";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiInfo,
  FiXCircle,
} from "react-icons/fi";
import { VscClose } from "react-icons/vsc";
import { Btn } from "../Elements";
import styles from "./toasts.module.css";

// How long a toast stays, errors stay until closed
const TOAST_MS: Record<FeedbackLevel, number | null> = {
  success: 4000,
  info: 4000,
  warning: 7000,
  error: null,
};

const ICONS: Record<FeedbackLevel, IconType> = {
  success: FiCheckCircle,
  info: FiInfo,
  warning: FiAlertTriangle,
  error: FiXCircle,
};

// Sets --level-color for the level
const LEVELS: Record<FeedbackLevel, string> = {
  success: styles.success,
  info: styles.info,
  warning: styles.warning,
  error: styles.error,
};

/** The icon of a notice's level, in the level's color. */
export function LevelIcon({
  level,
  size = 18,
}: {
  level: FeedbackLevel;
  size?: number;
}) {
  const Icon = ICONS[level];
  return (
    <span className={cx(styles.icon, LEVELS[level])}>
      <Icon size={size} />
    </span>
  );
}

type ToastProps = {
  notification: AppNotification;
  onDismiss: (id: string) => void;
};

function Toast({ notification, onDismiss }: ToastProps) {
  const { id, level, message } = notification;
  const duration = TOAST_MS[level];
  const [paused, setPaused] = useState(false);
  // Time left, kept while hovering pauses the timer
  const remaining = useRef(duration ?? 0);

  useEffect(() => {
    if (duration === null || paused) return undefined;
    const started = Date.now();
    const timer = setTimeout(() => onDismiss(id), remaining.current);
    return () => {
      clearTimeout(timer);
      remaining.current -= Date.now() - started;
    };
  }, [duration, paused, id, onDismiss]);

  return (
    <div
      role={level === "error" ? "alert" : "status"}
      className={cx(styles.toast, LEVELS[level])}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <LevelIcon level={level} />
      <p className={styles.message}>{message}</p>
      <Btn
        variant="icon"
        title="Close"
        className={styles.close}
        onClick={() => onDismiss(id)}
      >
        <VscClose size={16} />
      </Btn>
    </div>
  );
}

type Props = {
  // Oldest first, the newest is shown at the bottom
  toasts: AppNotification[];
  onDismiss: (id: string) => void;
};

/** Notices stacked in the bottom right corner, above modals. */
export function Toasts({ toasts, onDismiss }: Props) {
  return (
    <div role="region" aria-label="Notifications" className={styles.viewport}>
      {toasts.map((n) => (
        <Toast key={n.id} notification={n} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
