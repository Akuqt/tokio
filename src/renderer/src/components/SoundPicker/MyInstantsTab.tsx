import { APP_EVENTS, APP_EVENTS_RESPONSE } from "@/common/types";
import { AlertTestRequest } from "@renderer/hooks";
import { useEffect, useState } from "react";
import { FiCheckCircle, FiDownload } from "react-icons/fi";
import { Input } from "../Elements";
import { PREVIEW_VOLUME, PreviewButton } from "./PreviewButton";
import styles from "./soundpicker.module.css";
import { useSoundSearch } from "./useSoundSearch";

type Props = {
  // Id of the alert the picked sound is for
  id: string;
  // Hidden tabs stay mounted, so results and scroll survive tab switches
  hidden: boolean;
  testing: string | null;
  onTest: (req: AlertTestRequest) => void;
};

export function MyInstantsTab({ id, hidden, testing, onTest }: Props) {
  const [query, setQuery] = useState("");
  // Url of the sound being downloaded
  const [downloading, setDownloading] = useState<string | null>(null);

  const { sounds, loading, failed, search, listRef, sentinelRef } =
    useSoundSearch(!hidden);

  useEffect(() => {
    const removeSetAlertSound = window.api.on(
      APP_EVENTS_RESPONSE.SET_ALERT_SOUND,
      (res) => {
        if (res?.id === id) setDownloading(null);
      },
    );

    return () => {
      removeSetAlertSound();
    };
  }, [id]);

  return (
    <div style={{ display: hidden ? "none" : "contents" }}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          search(query);
        }}
      >
        <Input
          placeholder="Search sounds... (Enter)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          textColor="var(--font-primary)"
          bgColor={{
            primary: "var(--background-primary)",
            secondary: "var(--background-secondary)",
          }}
        />
      </form>

      <div ref={listRef} className={styles.list}>
        {sounds.map((sound) => (
          <div key={sound.url} className={styles.row}>
            <span className={styles.name} title={sound.name}>
              {sound.name}
            </span>
            <PreviewButton
              playing={testing === sound.url}
              onClick={() =>
                onTest({
                  id: sound.url,
                  url: sound.url,
                  volume: PREVIEW_VOLUME,
                })
              }
            />
            <button
              className={`${styles.icon_btn} ${sound.saved ? styles.saved : ""}`}
              title={
                sound.saved ? "Already saved, use this sound" : "Use this sound"
              }
              disabled={downloading !== null}
              onClick={() => {
                setDownloading(sound.url);
                window.api.emit(APP_EVENTS.DOWNLOAD_SOUND, {
                  id,
                  url: sound.url,
                  name: sound.name,
                });
              }}
            >
              {sound.saved ? (
                <FiCheckCircle size={20} />
              ) : (
                <FiDownload size={20} />
              )}
            </button>
          </div>
        ))}

        {loading && <p className={styles.status}>Loading...</p>}
        {!loading && sounds.length === 0 && !failed && (
          <p className={styles.status}>No sounds found.</p>
        )}

        <div ref={sentinelRef} />
      </div>

      {failed && <p className={styles.error}>Couldn't reach MyInstants.</p>}
    </div>
  );
}
