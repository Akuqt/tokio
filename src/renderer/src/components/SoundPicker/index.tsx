import { AlertSound } from "@/common/schemas";
import {
  APP_EVENTS,
  APP_EVENTS_RESPONSE,
  MyInstantsSound,
} from "@/common/types";
import { Input, Modal } from "@/components";
import { AlertTestRequest } from "@renderer/hooks";
import { useEffect, useRef, useState } from "react";
import {
  FiCheck,
  FiCheckCircle,
  FiDownload,
  FiPlayCircle,
  FiStopCircle,
} from "react-icons/fi";
import styles from "./soundpicker.module.css";

const PREVIEW_VOLUME = 100;

type Tab = "library" | "myinstants";

type Props = {
  // Id of the alert the picked sound is for
  id: string;
  // Id of the sound test loading or playing
  testing: string | null;
  onTest: (req: AlertTestRequest) => void;
  // Picks a sound from the library, which is already saved
  onSelect: (sound: AlertSound) => void;
  onClose: () => void;
};

export function SoundPicker({ id, testing, onTest, onSelect, onClose }: Props) {
  // Chosen once the library loads: the library if it has sounds
  const [tab, setTab] = useState<Tab | null>(null);
  const [library, setLibrary] = useState<AlertSound[]>([]);
  const [query, setQuery] = useState("");
  // Query of the results being shown
  const [activeQuery, setActiveQuery] = useState("");
  const [page, setPage] = useState(1);
  const [sounds, setSounds] = useState<MyInstantsSound[]>([]);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Url of the sound being downloaded
  const [downloading, setDownloading] = useState<string | null>(null);

  // Latest request, so responses to older ones are ignored
  const request = useRef({ query: "", page: 1 });
  const listRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const load = (q: string, p: number) => {
    request.current = { query: q, page: p };
    setLoading(true);
    setError(null);
    window.api.emit(APP_EVENTS.SEARCH_SOUNDS, { query: q, page: p });
  };

  useEffect(() => {
    const removeSearchSounds = window.api.on(
      APP_EVENTS_RESPONSE.SEARCH_SOUNDS,
      (res) => {
        const req = request.current;
        if (!res || res.query !== req.query || res.page !== req.page) return;

        setLoading(false);
        setPage(res.page);
        setHasNextPage(res.hasNextPage);
        if (!res.success) setError("Couldn't reach MyInstants.");

        setSounds((prev) => {
          if (res.page === 1) return res.data;
          const seen = new Set(prev.map((s) => s.url));
          return [...prev, ...res.data.filter((s) => !seen.has(s.url))];
        });
      },
    );

    const removeSetAlertSound = window.api.on(
      APP_EVENTS_RESPONSE.SET_ALERT_SOUND,
      (res) => {
        if (!res || res.id !== id) return;
        setDownloading(null);
        if (!res.success) setError("Couldn't save that sound.");
      },
    );

    const removeGetSounds = window.api.on(
      APP_EVENTS_RESPONSE.GET_SOUNDS,
      (res) => {
        if (!res) return;
        setLibrary(res.data);
        setTab((t) => t ?? (res.data.length > 0 ? "library" : "myinstants"));
      },
    );

    load("", 1);
    window.api.emit(APP_EVENTS.GET_SOUNDS);

    return () => {
      removeSearchSounds();
      removeSetAlertSound();
      removeGetSounds();
    };
  }, [id]);

  // Load the next page when the end of the list scrolls into view.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || tab !== "myinstants" || loading || !hasNextPage) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) load(activeQuery, page + 1);
      },
      { root: listRef.current, rootMargin: "120px" },
    );
    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [tab, loading, hasNextPage, activeQuery, page]);

  const filteredLibrary = library.filter((s) =>
    s.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const previewButton = (key: string, req: AlertTestRequest) => (
    <button
      className={`${styles.icon_btn} ${testing === key ? styles.playing : ""}`}
      title={testing === key ? "Stop preview" : "Preview"}
      onClick={() => onTest(req)}
    >
      {testing === key ? (
        <FiStopCircle size={20} />
      ) : (
        <FiPlayCircle size={20} />
      )}
    </button>
  );

  return (
    <Modal
      title="Select a sound"
      description="Pick one of your sounds, search MyInstants, or use a file from your computer."
      confirmText="Browse file..."
      maxWidth="640px"
      onClose={onClose}
      onConfirm={() => window.api.emit(APP_EVENTS.IMPORT_SOUND, { id })}
    >
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === "library" ? styles.tab_active : ""}`}
          onClick={() => setTab("library")}
        >
          My sounds
        </button>
        <button
          className={`${styles.tab} ${tab === "myinstants" ? styles.tab_active : ""}`}
          onClick={() => setTab("myinstants")}
        >
          MyInstants
        </button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (tab !== "myinstants") return;
          setActiveQuery(query);
          listRef.current?.scrollTo({ top: 0 });
          load(query, 1);
        }}
      >
        <Input
          placeholder={
            tab === "library"
              ? "Filter your sounds..."
              : "Search sounds... (Enter)"
          }
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          textColor="var(--font-primary)"
          bgColor={{
            primary: "var(--background-primary)",
            secondary: "var(--background-secondary)",
          }}
        />
      </form>

      {tab === "library" && (
        <div className={styles.list}>
          {filteredLibrary.map((sound) => (
            <div key={sound.file} className={styles.row}>
              <span className={styles.name} title={sound.name}>
                {sound.name}
              </span>
              {previewButton(sound.file, {
                id: sound.file,
                file: sound.file,
                volume: PREVIEW_VOLUME,
              })}
              <button
                className={styles.icon_btn}
                title="Use this sound"
                onClick={() => onSelect(sound)}
              >
                <FiCheck size={20} />
              </button>
            </div>
          ))}

          {filteredLibrary.length === 0 && (
            <p className={styles.status}>
              {library.length === 0
                ? "No uploaded sounds. Add them in Settings, or browse for a file."
                : "No sounds match."}
            </p>
          )}
        </div>
      )}

      {/* Kept mounted while hidden, so the results and scroll survive tab switches */}
      <div
        ref={listRef}
        className={styles.list}
        style={{ display: tab === "myinstants" ? undefined : "none" }}
      >
        {sounds.map((sound) => (
          <div key={sound.url} className={styles.row}>
            <span className={styles.name} title={sound.name}>
              {sound.name}
            </span>
            {previewButton(sound.url, {
              id: sound.url,
              url: sound.url,
              volume: PREVIEW_VOLUME,
            })}
            <button
              className={`${styles.icon_btn} ${sound.saved ? styles.saved : ""}`}
              title={
                sound.saved ? "Already saved, use this sound" : "Use this sound"
              }
              disabled={downloading !== null}
              onClick={() => {
                setDownloading(sound.url);
                setError(null);
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

        {loading ? (
          <p className={styles.status}>Loading...</p>
        ) : (
          sounds.length === 0 &&
          !error && <p className={styles.status}>No sounds found.</p>
        )}

        <div ref={sentinelRef} />
      </div>

      {error && <p className={styles.error}>{error}</p>}
    </Modal>
  );
}
