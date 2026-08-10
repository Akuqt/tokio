import { Link, Outlet } from "@tanstack/react-router";
import React, { useEffect, useRef, useState } from "react";
import {
  FiCheck,
  FiChevronDown,
  FiHome,
  FiMoon,
  FiSettings,
  FiSun,
  FiVolume2,
} from "react-icons/fi";
import {
  VscChromeClose,
  VscChromeMaximize,
  VscChromeMinimize,
  VscChromeRestore,
} from "react-icons/vsc";

import { useProfile, useTheme } from "@/hooks";

const navItemStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
  color: "var(--side-bar-items-color)",
  textDecoration: "none",
  fontSize: "11px",
  padding: "12px 4px",
  cursor: "pointer",
  transition: "color 0.2s, background-color 0.2s",
};

const windowControlStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "46px",
  height: "100%",
  background: "transparent",
  border: "none",
  color: "var(--nav-bar-controls-minimize-color)",
  cursor: "pointer",
  transition: "background-color 0.2s, color 0.2s",
};

export function Layout() {
  const { mode, toggleMode } = useTheme();
  const { profiles, changeProfile } = useProfile();

  const [isMaximized, setIsMaximized] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeProfile, setActiveProfile] = useState(
    profiles.find((p) => p.active),
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleMinimize = () => window.api?.minimize();
  const handleClose = () => window.api?.close();
  const handleMaximize = () => window.api?.maximize();

  useEffect(() => {
    window.api?.onResize((state) => {
      if (state === "normal") {
        setIsMaximized(false);
      } else {
        setIsMaximized(true);
      }
    });

    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100vh",
        backgroundColor: "var(--background-color-primary)",
        color: "var(--font-color-primary)",
      }}
    >
      {/* 1. Navbar (Title Bar) */}
      <header
        className="drag-region"
        style={{
          height: "56px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "var(--background-color-secundary)",
          borderBottom: "1px solid var(--nav-bar-profile-selected-background)",
          width: "100%",
        }}
      >
        {/* Left Side: Logo */}
        <div
          className="no-drag"
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "6px",
            backgroundColor: "var(--logo-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
            color: "var(--logo-secondary)",
            marginLeft: "1.25rem",
          }}
        >
          T
        </div>

        {/* Right Side: Theme Toggle, Stream Profile & Controls */}
        <div style={{ display: "flex", height: "100%", alignItems: "center" }}>
          {/* Theme Toggle Button */}
          <div
            className="no-drag"
            onClick={toggleMode}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "32px",
              height: "32px",
              borderRadius: "6px",
              cursor: "pointer",
              color: "var(--font-color-secondary)",
              transition: "background-color 0.2s, color 0.2s",
              marginRight: "8px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor =
                "var(--nav-bar-profile-hover)";
              e.currentTarget.style.color = "var(--font-color-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "var(--font-color-secondary)";
            }}
            title="Toggle Theme"
          >
            {mode === "dark" ? <FiSun size={16} /> : <FiMoon size={16} />}
          </div>

          {/* Stream Profile Dropdown Container */}
          <div
            className="no-drag"
            style={{ position: "relative" }}
            ref={dropdownRef}
          >
            {/* Dropdown Toggle Button */}
            <div
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: isProfileOpen
                  ? "var(--font-color-primary)"
                  : "var(--font-color-secondary)",
                fontSize: "13px",
                cursor: "pointer",
                padding: "6px 16px",
                borderRadius: "6px",
                backgroundColor: isProfileOpen
                  ? "var(--nav-bar-profile-selected-background)"
                  : "transparent",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                if (!isProfileOpen)
                  e.currentTarget.style.backgroundColor =
                    "var(--nav-bar-profile-hover)";
              }}
              onMouseLeave={(e) => {
                if (!isProfileOpen)
                  e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  backgroundColor: "var(--nav-bar-profile-selected-background)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                }}
              >
                🌹
              </div>
              <span>{activeProfile?.name}</span>
              <FiChevronDown
                size={14}
                style={{
                  transform: isProfileOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s",
                }}
              />
            </div>

            {/* Dropdown Menu */}
            {isProfileOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 4px)",
                  right: "16px",
                  width: "200px",
                  backgroundColor: "var(--background-color-secundary)",
                  border:
                    "1px solid var(--nav-bar-profile-selected-background)",
                  borderRadius: "6px",
                  padding: "4px",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
                  zIndex: 50,
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px",
                }}
              >
                {profiles.map((profile, key) => (
                  <div
                    key={key}
                    onClick={() => {
                      setActiveProfile(profile);
                      setIsProfileOpen(false);
                      changeProfile(profile.file);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      fontSize: "13px",
                      color:
                        activeProfile?.file === profile.file
                          ? "var(--font-color-primary)"
                          : "var(--font-color-secondary)",
                      backgroundColor:
                        activeProfile?.file === profile.file
                          ? "var(--nav-bar-profile-selected-background)"
                          : "transparent",
                      borderRadius: "4px",
                      cursor: "pointer",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (activeProfile?.file !== profile.file)
                        e.currentTarget.style.backgroundColor =
                          "var(--nav-bar-profile-hover)";
                    }}
                    onMouseLeave={(e) => {
                      if (activeProfile?.file !== profile.file)
                        e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    {profile.name}
                    {activeProfile === profile && (
                      <FiCheck
                        size={14}
                        color="var(--nav-bar-profile-selected-tick)"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Window Controls */}
          <div style={{ display: "flex", height: "100%" }} className="no-drag">
            <button
              onClick={handleMinimize}
              style={windowControlStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "var(--nav-bar-controls-minimize-hover)";
                e.currentTarget.style.color = "var(--font-color-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color =
                  "var(--nav-bar-controls-minimize-color)";
              }}
              title="Minimize"
            >
              <VscChromeMinimize size={14} />
            </button>

            <button
              onClick={handleMaximize}
              style={{
                ...windowControlStyle,
                color: "var(--nav-bar-controls-maximize-color)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "var(--nav-bar-controls-maximize-hover)";
                e.currentTarget.style.color = "var(--font-color-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color =
                  "var(--nav-bar-controls-maximize-color)";
              }}
              title={isMaximized ? "Restore" : "Maximize"}
            >
              {isMaximized ? (
                <VscChromeRestore size={18} />
              ) : (
                <VscChromeMaximize size={14} />
              )}
            </button>

            <button
              onClick={handleClose}
              style={{
                ...windowControlStyle,
                color: "var(--nav-bar-controls-close-color)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "var(--nav-bar-controls-close-hover)";
                e.currentTarget.style.color = "var(--font-color-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color =
                  "var(--nav-bar-controls-close-color)";
              }}
              title="Close"
            >
              <VscChromeClose size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Area */}
      <div
        style={{ flex: 1, display: "flex", width: "100%", overflow: "hidden" }}
      >
        {/* Sidebar */}
        <nav
          style={{
            width: "72px",
            backgroundColor: "var(--background-color-secundary)",
            borderRight: "1px solid var(--nav-bar-profile-selected-background)",
            display: "flex",
            flexDirection: "column",
            padding: "8px 0",
            gap: "4px",
            zIndex: 10,
          }}
        >
          {/* 1. Home */}
          <Link
            to="/"
            style={navItemStyle}
            activeProps={{
              style: {
                color: "var(--side-bar-items-selected)",
                fontWeight: "bold",
              },
            }}
            onMouseEnter={(e) => {
              if (
                e.currentTarget.style.color !== "var(--side-bar-items-selected)"
              ) {
                e.currentTarget.style.color = "var(--side-bar-items-hover)";
              }
            }}
            onMouseLeave={(e) => {
              if (
                e.currentTarget.style.color !== "var(--side-bar-items-selected)"
              ) {
                e.currentTarget.style.color = "var(--side-bar-items-color)";
              }
            }}
          >
            <FiHome size={22} />
            Home
          </Link>

          {/* 2. TTS */}
          <Link
            to="/tts"
            style={navItemStyle}
            activeProps={{
              style: {
                color: "var(--side-bar-items-selected)",
                fontWeight: "bold",
              },
            }}
            onMouseEnter={(e) => {
              if (
                e.currentTarget.style.color !== "var(--side-bar-items-selected)"
              ) {
                e.currentTarget.style.color = "var(--side-bar-items-hover)";
              }
            }}
            onMouseLeave={(e) => {
              if (
                e.currentTarget.style.color !== "var(--side-bar-items-selected)"
              ) {
                e.currentTarget.style.color = "var(--side-bar-items-color)";
              }
            }}
          >
            <FiVolume2 size={22} />
            TTS
          </Link>

          {/* 3. Settings */}
          <Link
            to="/settings"
            style={{ ...navItemStyle, marginTop: "auto" }}
            activeProps={{
              style: {
                color: "var(--side-bar-items-selected)",
                fontWeight: "bold",
              },
            }}
            onMouseEnter={(e) => {
              if (
                e.currentTarget.style.color !== "var(--side-bar-items-selected)"
              ) {
                e.currentTarget.style.color = "var(--side-bar-items-hover)";
              }
            }}
            onMouseLeave={(e) => {
              if (
                e.currentTarget.style.color !== "var(--side-bar-items-selected)"
              ) {
                e.currentTarget.style.color = "var(--side-bar-items-color)";
              }
            }}
          >
            <FiSettings size={22} />
            Settings
          </Link>
        </nav>

        {/* Content View Area */}
        <main
          style={{
            flex: 1,
            backgroundColor: "var(--background-color-primary)",
            padding: "2rem",
            overflowY: "auto",
            width: "100%",
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
