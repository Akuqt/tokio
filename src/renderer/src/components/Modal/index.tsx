import React from "react";

const actionButtonStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
  padding: "0 16px",
  height: "40px", // Explicit height strictly matches inputStyle
  borderRadius: "4px",
  cursor: "pointer",
  backgroundColor: "var(--nav-bar-profile-selected-background)",
  color: "var(--font-color-primary)",
  border: "1px solid transparent",
  fontSize: "14px",
  fontWeight: 500,
  transition: "background-color 0.2s",
  boxSizing: "border-box",
};

// --- Reusable Modal Component ---
export function Modal({
  title,
  description,
  onClose,
  onConfirm,
  confirmText = "Confirm",
  children,
}: {
  title: string;
  description: string;
  onClose: () => void;
  onConfirm: () => void;
  confirmText?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          backgroundColor: "var(--background-color-primary)",
          border: "1px solid var(--nav-bar-profile-selected-background)",
          borderRadius: "8px",
          padding: "24px",
          maxWidth: "400px",
          width: "100%",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <h3
          style={{
            margin: 0,
            color: "var(--font-color-primary)",
            fontSize: "18px",
          }}
        >
          {title}
        </h3>
        <p
          style={{
            margin: 0,
            color: "var(--font-color-secondary)",
            fontSize: "14px",
            lineHeight: 1.5,
          }}
        >
          {description}
        </p>

        {children && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              marginTop: "4px",
            }}
          >
            {children}
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
            marginTop: "8px",
          }}
        >
          <button
            onClick={onClose}
            style={{
              ...actionButtonStyle,
              backgroundColor: "transparent",
              border: "1px solid var(--nav-bar-profile-selected-background)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor =
                "var(--nav-bar-profile-hover)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              ...actionButtonStyle,
              backgroundColor: "var(--logo-primary)",
              color: "var(--logo-secondary)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
