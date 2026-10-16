import { ReactNode } from "react";
import { VscClose } from "react-icons/vsc";
import { Btn } from "../Elements";
import styles from "./modal.module.css";

type Props = {
  title: string;
  description?: string;
  onClose: () => void;
  // With onConfirm and no footer, the footer is Cancel and a confirm button
  onConfirm?: () => void;
  confirmText?: string;
  // Replaces the default footer
  footer?: ReactNode;
  // Adds a close button to the header
  closeButton?: boolean;
  maxWidth?: string;
  children?: ReactNode;
};

export function Modal({
  title,
  description,
  onClose,
  onConfirm,
  confirmText = "Confirm",
  footer,
  closeButton,
  maxWidth = "400px",
  children,
}: Props) {
  const actions =
    footer ??
    (onConfirm && (
      <>
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn variant="accent" onClick={onConfirm}>
          {confirmText}
        </Btn>
      </>
    ));

  return (
    <div className={styles.backdrop}>
      <div role="dialog" className={styles.card} style={{ maxWidth }}>
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
          {closeButton && (
            <Btn variant="icon" title="Close" onClick={onClose}>
              <VscClose size={24} />
            </Btn>
          )}
        </div>

        {description && <p className={styles.description}>{description}</p>}

        {children && <div className={styles.body}>{children}</div>}

        {actions && <div className={styles.footer}>{actions}</div>}
      </div>
    </div>
  );
}
