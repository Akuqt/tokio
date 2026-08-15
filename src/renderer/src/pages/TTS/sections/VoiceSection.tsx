import { APP_EVENTS } from "@/common/types";
import { VoiceDropdown } from "@renderer/components/VoiceDropdown";
import { ClipLoader } from "react-spinners";
import { TTSAction, TTSState } from "../helper";
import styles from "../tts.module.css";

interface Props {
  settings: TTSState["settings"];
  voices: TTSState["voices"];
  testMSG: string;
  testLoading: boolean;
  dispatch: React.Dispatch<TTSAction>;
  ttsTestQueue: any;
}

export function VoiceSection({
  settings,
  voices,
  testMSG,
  testLoading,
  dispatch,
  ttsTestQueue,
}: Props) {
  return (
    <div className={styles.section}>
      <div>
        <h2 className={styles.section_header}>Voice</h2>
        <p className={styles.section_description}>
          Configure the primary Text-to-Speech voice for your stream.
        </p>
      </div>

      <div className={styles.voice_container}>
        <VoiceDropdown
          voices={voices}
          current={settings.voice}
          onChange={(v) => {
            dispatch({ type: "setVoice", payload: v });
          }}
        />

        <div>
          <label className={styles.label_title}>
            Speed ({settings.filters.speed}x)
          </label>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={settings.filters.speed}
            onChange={(e) => {
              dispatch({
                type: "setSpeed",
                payload: parseFloat(e.target.value),
              });
              ttsTestQueue.setFilters({
                speed: settings.filters.speed,
              });
            }}
          />
        </div>

        <div>
          <label className={styles.label_title}>
            Pitch ({settings.filters.pitch})
          </label>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={settings.filters.pitch}
            onChange={(e) => {
              dispatch({
                type: "setPitch",
                payload: parseFloat(e.target.value),
              });
              ttsTestQueue.setFilters({
                pitch: settings.filters.pitch,
              });
            }}
          />
        </div>

        <div>
          <label className={styles.label_title}>
            Volume ({settings.filters.volume}%)
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={settings.filters.volume}
            onChange={(e) => {
              dispatch({
                type: "setVolume",
                payload: parseFloat(e.target.value),
              });

              ttsTestQueue.setFilters({
                volume: settings.filters.volume / 100,
              });
            }}
          />
        </div>
      </div>

      <div className={styles.tester_container}>
        <button
          className={styles.tester_btn}
          disabled={testMSG === "" || testLoading}
          style={{
            cursor: testMSG !== "" && !testLoading ? "pointer" : "not-allowed",
          }}
          onClick={() => {
            dispatch({ type: "setTestLoading", payload: true });
            window.api.emit(APP_EVENTS.GET_TTS_TEST, {
              text: testMSG,
              voice: settings.voice,
            });
          }}
        >
          {testLoading ? (
            <ClipLoader
              size={16}
              color="var(--logo-secondary)"
              cssOverride={{
                margin: 4,
                padding: 0,
              }}
            />
          ) : (
            <>Test Voice</>
          )}
        </button>
        <input
          type="text"
          placeholder="Type a message to test how the TTS sounds..."
          className={styles.input_style}
          value={testMSG}
          onChange={(e) =>
            dispatch({ type: "setTestMSG", payload: e.target.value })
          }
        />
      </div>
    </div>
  );
}
