import { AlertSound } from "@/common/schemas";
import { APP_EVENTS, APP_EVENTS_RESPONSE } from "@/common/types";
import { useAlertTest } from "@renderer/hooks";
import { useEffect, useRef, useState } from "react";
import {
  FiMusic,
  FiPlayCircle,
  FiStopCircle,
  FiTrash2,
  FiUpload,
} from "react-icons/fi";
import styles from "../settings.module.css";

const PREVIEW_VOLUME = 100;

export function SoundsSection() {
  const isInitialMount = useRef(true);
  const [sounds, setSounds] = useState<AlertSound[]>([]);
  const [error, setError] = useState(false);

  const test = useAlertTest();

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      window.api.emit(APP_EVENTS.GET_SOUNDS);
    }

    const removeGetSounds = window.api.on(
      APP_EVENTS_RESPONSE.GET_SOUNDS,
      (res) => {
        if (!res) return;
        setSounds(res.data);
        setError(!res.success);
      },
    );

    return () => {
      removeGetSounds();
    };
  }, []);

  return (
    <div className={styles.section}>
      <div className={styles.sounds_header}>
        <div>
          <h2 className={styles.section_header}>
            <FiMusic style={{ marginRight: "8px", verticalAlign: "middle" }} />{" "}
            Sound Library
          </h2>
          <p className={styles.section_description}>
            Upload your own sounds to use them in alerts on any profile.
          </p>
        </div>
        <button
          className={styles.action_btn}
          onClick={() => window.api.emit(APP_EVENTS.UPLOAD_SOUNDS)}
        >
          <FiUpload /> Upload
        </button>
      </div>

      <div className={styles.sounds_list}>
        {sounds.length === 0 ? (
          <p className={styles.sounds_empty}>No sounds uploaded yet.</p>
        ) : (
          sounds.map((sound) => {
            const playing = test.testing === sound.file;
            return (
              <div key={sound.file} className={styles.sound_row}>
                <button
                  className={`${styles.icon_btn} ${playing ? styles.playing : ""}`}
                  title={playing ? "Stop" : "Play"}
                  onClick={() =>
                    test.toggle({
                      id: sound.file,
                      file: sound.file,
                      volume: PREVIEW_VOLUME,
                    })
                  }
                >
                  {playing ? (
                    <FiStopCircle size={20} />
                  ) : (
                    <FiPlayCircle size={20} />
                  )}
                </button>
                <span className={styles.sound_name} title={sound.name}>
                  {sound.name}
                </span>
                <button
                  className={styles.icon_btn}
                  title="Remove"
                  onClick={() => {
                    if (playing) test.stop();
                    window.api.emit(APP_EVENTS.REMOVE_SOUND, {
                      file: sound.file,
                    });
                  }}
                >
                  <FiTrash2 size={20} />
                </button>
              </div>
            );
          })
        )}
      </div>

      {error && (
        <p className={styles.sounds_error}>
          Some sounds couldn't be uploaded or removed.
        </p>
      )}
    </div>
  );
}
