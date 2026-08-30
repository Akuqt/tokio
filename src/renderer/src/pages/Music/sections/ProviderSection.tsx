import { FaSpotify, FaYoutube } from "react-icons/fa";
import { ClipLoader } from "react-spinners";
import { MusicAction, MusicState } from "../helper";
import styles from "../music.module.css";

interface Props {
  provider: MusicState["settings"]["provider"];
  connected: boolean;
  loading: boolean;
  onConnect: () => void;
  dispatch: React.Dispatch<MusicAction>;
}

export function ProviderSection({
  dispatch,
  provider,
  connected,
  loading,
  onConnect,
}: Props) {
  return (
    <div className={styles.section}>
      <div>
        <h2 className={styles.section_header}>Provider</h2>
        <p className={styles.section_description}>
          Select and connect to your preferred music source.
        </p>
      </div>

      <div className={styles.provider_status}>
        Status:{" "}
        <span className={connected ? styles.provider_status_connected : ""}>
          {connected ? "Connected" : "Disconnected"}
        </span>
      </div>

      <div
        className={`${styles.tab_container} ${
          connected ? styles.locked_state : ""
        }`}
      >
        <button
          onClick={() => {
            dispatch({ type: "setProvider", payload: "YouTube" });
          }}
          className={`${styles.tab_btn} ${
            provider.name === "YouTube"
              ? styles.tab_btn_active
              : styles.tab_btn_inactive
          }`}
        >
          <FaYoutube
            size={20}
            color={provider.name === "YouTube" ? "#ff0000" : "currentColor"}
          />
          YouTube
        </button>

        <button
          onClick={() => {
            dispatch({ type: "setProvider", payload: "Spotify" });
          }}
          className={`${styles.tab_btn} ${
            provider.name === "Spotify"
              ? styles.tab_btn_active
              : styles.tab_btn_inactive
          }`}
        >
          <FaSpotify
            size={20}
            color={provider.name === "Spotify" ? "#1DB954" : "currentColor"}
          />
          Spotify
        </button>
      </div>

      <div
        className={`${styles.expandable_container} ${
          provider.name === "Spotify" ? styles.open : ""
        } ${connected ? styles.locked_state : ""}`}
      >
        <div className={styles.expandable_content}>
          <label className={styles.label_title}>Spotify Client ID</label>
          <input
            type="password"
            className={`${styles.input_style} ${styles.input_constrained}`}
            value={provider.key}
            onChange={(e) =>
              dispatch({ type: "setProviderKey", payload: e.target.value })
            }
            disabled={connected}
            placeholder="Enter your Spotify Client ID..."
          />
        </div>
      </div>

      <div>
        <button
          onClick={onConnect}
          style={{
            cursor:
              provider.name === "Spotify" && provider.key === ""
                ? "not-allowed"
                : "pointer",
          }}
          disabled={provider.name === "Spotify" && provider.key === ""}
          className={`${styles.tester_btn} ${styles.connect_btn} ${
            connected || (provider.name === "Spotify" && provider.key === "")
              ? styles.connect_btn_connected
              : ""
          }`}
        >
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
            <>{connected ? "Disconnect" : "Connect"}</>
          )}
        </button>
      </div>
    </div>
  );
}
