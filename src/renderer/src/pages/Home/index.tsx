import { APP_EVENTS, APP_EVENTS_RESPONSE } from "@/common/types";
import { useEffect, useReducer, useRef } from "react";
import { FiPlay, FiSquare } from "react-icons/fi";
import { ClipLoader } from "react-spinners";
import { defaultState, formatStat, reducer } from "./helper";
import styles from "./home.module.css";

export function Home() {
  const isInitialMount = useRef(true);
  const [{ likes, settings, views, profile, connected, loading }, dispatch] =
    useReducer(reducer, defaultState);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      window.api.emit(APP_EVENTS.GET_PROFILE);
      window.api.emit(APP_EVENTS.GET_SETTINGS);
      window.api.emit(APP_EVENTS.IS_CONNECTED);
    }

    const removeGetProfile = window.api.on(
      APP_EVENTS_RESPONSE.GET_PROFILE,
      (res) => {
        if (res?.success) {
          dispatch({ type: "setProfile", payload: res.profile! });
        }
      },
    );

    const removeGetSettings = window.api.on(
      APP_EVENTS_RESPONSE.GET_SETTINGS,
      (res) => {
        if (res?.success) {
          dispatch({ type: "initSettings", payload: res.data!["settings"] });
        }
      },
    );
    const removeConnect = window.api.on(
      APP_EVENTS_RESPONSE.CONNECTED,
      (res) => {
        if (res) {
          dispatch({ type: "setConnected", payload: res.success });
          dispatch({ type: "setLikes", payload: res.stats.likes });
          dispatch({
            type: "setViews",
            payload: {
              current: res.stats.viewers,
              total: res.stats.views,
            },
          });
          dispatch({ type: "setLoading", payload: false });
        }
      },
    );
    const removeViewers = window.api.on(APP_EVENTS_RESPONSE.VIEWS, (res) => {
      if (res?.data) {
        dispatch({
          type: "setViews",
          payload: {
            current: res.data.viewers,
            total: res.data.views,
          },
        });
      }
    });
    const removeLikes = window.api.on(APP_EVENTS_RESPONSE.LIKES, (res) => {
      if (res?.likes) {
        dispatch({ type: "setLikes", payload: res.likes });
      }
    });

    return () => {
      removeGetProfile();
      removeGetSettings();
      removeConnect();
      removeLikes();
      removeViewers();
    };
  }, []);

  const handleConnect = () => {
    if (!profile.connector.username.replace("@", "").trim()) return;
    dispatch({ type: "setLoading", payload: true });
    window.api.emit(APP_EVENTS.CONNECT, {
      username: profile.connector.username,
    });
  };

  const handleDisconnect = () => {
    dispatch({ type: "setLoading", payload: true });
    window.api.emit(APP_EVENTS.DISCONNECT);
  };

  const stats = [
    { label: "Viewers", value: views.current },
    { label: "Likes", value: likes },
    { label: "Total Views", value: views.total },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>Dashboard</h1>
            <p className={styles.subtitle}>
              Connect to your TikTok Live to begin receiving events.
            </p>
          </div>

          <div className={styles.statusBadge}>
            <div
              className={`${styles.dot} ${connected ? styles.dotOnline : styles.dotOffline}`}
            />
            {connected ? "Connected" : "Offline"}
          </div>
        </div>

        <div className={styles.heroInputGroup}>
          <input
            type="text"
            className={styles.heroInput}
            placeholder="@username"
            value={profile.connector.username}
            onChange={(e) => {
              dispatch({ type: "setUsername", payload: e.target.value });
            }}
            disabled={connected}
          />

          {!connected ? (
            <button className={styles.heroButton} onClick={handleConnect}>
              {loading ? (
                <ClipLoader
                  size={16}
                  color="var(--font-primary)"
                  cssOverride={{
                    margin: 4,
                    padding: 0,
                  }}
                />
              ) : (
                <>
                  <FiPlay size={18} /> Connect
                </>
              )}
            </button>
          ) : (
            <button className={styles.heroButton} onClick={handleDisconnect}>
              {loading ? (
                <ClipLoader
                  size={16}
                  color="var(--font-primary)"
                  cssOverride={{
                    margin: 4,
                    padding: 0,
                  }}
                />
              ) : (
                <>
                  <FiSquare size={18} /> Disconnect
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <div className={styles.section}>
        <div>
          <h2 className={styles.title} style={{ fontSize: "16px" }}>
            Active Features
          </h2>
          <p className={styles.subtitle} style={{ marginBottom: "16px" }}>
            Toggle which modules are actively running during this session.
          </p>
        </div>

        <div className={styles.checkboxGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              className={styles.checkboxInput}
              checked={settings.activeFeatures.tts}
              onChange={(e) => {
                window.api.emit(APP_EVENTS.ACTIVE_FEATURES, {
                  tts: e.target.checked,
                });
                dispatch({ type: "setTTSFeature", payload: e.target.checked });
              }}
            />
            TTS
          </label>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              className={styles.checkboxInput}
              checked={settings.activeFeatures.music}
              onChange={(e) => {
                window.api.emit(APP_EVENTS.ACTIVE_FEATURES, {
                  music: e.target.checked,
                });
                dispatch({
                  type: "setMusicFeature",
                  payload: e.target.checked,
                });
              }}
            />
            Music
          </label>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              className={styles.checkboxInput}
              checked={settings.activeFeatures.alerts}
              onChange={(e) => {
                window.api.emit(APP_EVENTS.ACTIVE_FEATURES, {
                  alerts: e.target.checked,
                });
                dispatch({
                  type: "setAlertsFeature",
                  payload: e.target.checked,
                });
              }}
            />
            Alerts
          </label>
        </div>
      </div>

      <div className={styles.section} style={{ borderBottom: "none" }}>
        <div>
          <h2
            className={styles.title}
            style={{ fontSize: "16px", marginBottom: "24px" }}
          >
            Live Stats
          </h2>
        </div>

        <div className={styles.statsGrid}>
          {stats.map(({ label, value }) => {
            const formatted = formatStat(value);
            return (
              <div key={label} className={styles.statBox}>
                <span
                  className={styles.statValue}
                  title={connected ? formatted.full : undefined}
                >
                  {connected ? formatted.short : "--"}
                </span>
                <span className={styles.statLabel}>{label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
