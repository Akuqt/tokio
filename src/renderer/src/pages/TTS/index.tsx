import { APP_EVENTS } from "@/common/types";
import { VoiceDropdown } from "@renderer/components/VoiceDropdown";
import { useAudio, useProfile } from "@renderer/hooks";
import { useServices } from "@renderer/hooks/useServices";
import isEqual from "fast-deep-equal";
import { useEffect, useMemo, useReducer, useRef } from "react";
import { FiArrowRight, FiPlus, FiSave, FiTrash2 } from "react-icons/fi";
import { ClipLoader } from "react-spinners";
import { reducer } from "./helper";
import styles from "./tts.module.css";

export function TTS() {
  const isInitialMount = useRef(true);

  const { getVoices } = useServices();
  const { profile } = useProfile();
  const { getQueue } = useAudio();

  const ttsTestQueue = getQueue("tts_test");

  const [
    {
      settings,
      settingsTemp,
      voices,
      testMSG,
      bannedlistTemp,
      blacklistTemp,
      whitelistTemp,
      testLoading,
    },
    dispatch,
  ] = useReducer(reducer, {
    settings: profile["tts"],
    settingsTemp: profile["tts"],
    voices: [],
    testMSG: "",
    bannedlistTemp: "",
    blacklistTemp: "",
    whitelistTemp: "",
    testLoading: false,
  });

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      dispatch({ type: "initSettings", payload: profile["tts"] }); // First Time
      ttsTestQueue.setFilters({
        pitch: profile["tts"].filters.pitch,
        speed: profile["tts"].filters.speed,
        volume: profile["tts"].filters.volume / 100,
      });
      getVoices();
    }

    const removeGetVoices = window.api.on(APP_EVENTS.RES_GET_VOICES, (res) => {
      if (res?.success) dispatch({ type: "setVoices", payload: res.voices });
    });
    const removeGetProfile = window.api.on(
      APP_EVENTS.RES_GET_PROFILE,
      (res) => {
        if (res?.success) {
          dispatch({ type: "initSettings", payload: res.profile["tts"] });
        }
      },
    );
    const removeUpdateTTSSettings = window.api.on(
      APP_EVENTS.RES_UPDATE_TTS_SETTINGS,
      (res) => {
        if (res?.success) {
          window.api.emit(APP_EVENTS.GET_PROFILE);
        }
      },
    );

    const removeGetTTSTest = window.api.on(
      APP_EVENTS.RES_GET_TTS_TEST,
      (res) => {
        if (res?.success) {
          dispatch({ type: "setTestLoading", payload: false });
          ttsTestQueue.enqueue(res.data, true);
        }
      },
    );

    return () => {
      removeGetProfile();
      removeGetVoices();
      removeUpdateTTSSettings();
      removeGetTTSTest();
    };
  }, []);

  const hasChanges = useMemo(() => {
    return !isEqual(settings, settingsTemp);
  }, [settings, settingsTemp]);

  return (
    <>
      <div className={styles.floating_save}>
        <button
          className={styles.floating_save_btn}
          onClick={() => {
            window.api.emit(APP_EVENTS.UPDATE_TTS_SETTINGS, { settings });
          }}
          style={{
            opacity: hasChanges ? 1 : 0,
            pointerEvents: hasChanges ? "all" : "none",
            cursor: hasChanges ? "pointer" : "none",
          }}
          disabled={!hasChanges}
        >
          <FiSave size={30} />
        </button>
      </div>
      <div className={styles.container}>
        {/* --- VOICE --- */}
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
                cursor:
                  testMSG !== "" && !testLoading ? "pointer" : "not-allowed",
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

        {/* --- FORMAT --- */}
        <div className={styles.section}>
          <div>
            <h2 className={styles.section_header}>Format</h2>
            <p className={styles.section_description}>
              Determine which chat messages get read aloud.
            </p>
          </div>

          <div className={styles.radio_container}>
            <label className={styles.radio_label_container}>
              <input
                type="radio"
                name="trigger"
                className={styles.radio_input}
                checked={settings.format.trigger.mode === "any"}
                onChange={() =>
                  dispatch({
                    type: "setTrigger",
                    payload: { mode: "any", value: "" },
                  })
                }
              />
              <div className={styles.radio_text_container}>
                <span className={styles.radio_text_title}>
                  Read All Comments
                </span>
                <span className={styles.radio_text_description}>
                  Every single message in chat will be processed by TTS.
                </span>
              </div>
            </label>

            <label className={styles.radio_label_container}>
              <input
                type="radio"
                name="trigger"
                className={styles.radio_input}
                checked={settings.format.trigger.mode === "dot"}
                onChange={() =>
                  dispatch({
                    type: "setTrigger",
                    payload: { mode: "dot", value: "." },
                  })
                }
              />
              <div className={styles.radio_text_container}>
                <span className={styles.radio_text_title}>
                  Dot Prefix ( . )
                </span>
                <span className={styles.radio_text_description}>
                  Only messages starting with a period will be read.
                </span>
              </div>
            </label>

            <label className={styles.radio_label_container}>
              <input
                type="radio"
                name="trigger"
                className={styles.radio_input}
                checked={settings.format.trigger.mode === "slash"}
                onChange={() =>
                  dispatch({
                    type: "setTrigger",
                    payload: { mode: "slash", value: "/" },
                  })
                }
              />
              <div className={styles.radio_text_container}>
                <span className={styles.radio_text_title}>
                  Slash Prefix ( / )
                </span>
                <span className={styles.radio_text_description}>
                  Only messages starting with a forward slash will be read.
                </span>
              </div>
            </label>

            <label className={styles.radio_label_container}>
              <input
                type="radio"
                name="trigger"
                className={styles.radio_input}
                checked={settings.format.trigger.mode === "custom"}
                onChange={() =>
                  dispatch({
                    type: "setTrigger",
                    payload: { mode: "custom", value: "" },
                  })
                }
              />
              <div className={styles.radio_text_container}>
                <span className={styles.radio_text_title_custom}>
                  Custom Command
                  <input
                    type="text"
                    value={
                      settings.format.trigger.mode === "custom"
                        ? settings.format.trigger.value
                        : ""
                    }
                    disabled={settings.format.trigger.mode !== "custom"}
                    placeholder="!tts"
                    onChange={(e) => {
                      if (settings.format.trigger.mode === "custom")
                        dispatch({
                          type: "setTrigger",
                          payload: {
                            mode: "custom",
                            value: e.target.value,
                          },
                        });
                    }}
                    className={`${styles.input_style} ${styles.input_trigger}`}
                  />
                </span>
                <span className={styles.radio_text_description}>
                  Only messages starting with this exact phrase will be read.
                </span>
              </div>
            </label>
          </div>

          <div style={{ marginTop: "8px" }}>
            <label className={styles.label_title}>Message Template</label>
            <input
              type="text"
              className={styles.input_style}
              value={settings.format.template}
              onChange={(e) =>
                dispatch({ type: "setTemplate", payload: e.target.value })
              }
            />
            <p className={styles.template_description}>
              Variables: {"{username}"}, {"{nickname}"}, {"{comment}"}
            </p>
          </div>
        </div>

        {/* --- PERMISSIONS --- */}
        <div className={styles.section}>
          <div>
            <h2 className={styles.section_header}>Permissions</h2>
            <p className={styles.section_description}>
              Control exactly who has permission to use the TTS system.
            </p>
          </div>

          <div className={styles.check_input_container}>
            <label className={styles.check_label}>
              <input
                type="checkbox"
                checked={settings.permissions.all}
                className={styles.check_input}
                onChange={(e) =>
                  dispatch({
                    type: "setPermissionsAll",
                    payload: e.target.checked,
                  })
                }
              />
              Allow Everyone
            </label>
            <label className={styles.check_label}>
              <input
                type="checkbox"
                checked={settings.permissions.followers}
                className={styles.check_input}
                onChange={(e) =>
                  dispatch({
                    type: "setPermissionsFollowers",
                    payload: e.target.checked,
                  })
                }
              />
              Followers Only
            </label>

            <label className={styles.check_label}>
              <input
                type="checkbox"
                checked={settings.permissions.superfans}
                className={styles.check_input}
                onChange={(e) =>
                  dispatch({
                    type: "setPermissionsSuperfans",
                    payload: e.target.checked,
                  })
                }
              />
              Superfans Only
            </label>
            <label className={styles.check_label}>
              <input
                type="checkbox"
                checked={settings.permissions.moderators}
                className={styles.check_input}
                onChange={(e) =>
                  dispatch({
                    type: "setPermissionsModerators",
                    payload: e.target.checked,
                  })
                }
              />
              Moderators Only
            </label>

            <div
              style={{ display: "flex", alignItems: "center", height: "38px" }}
            >
              <label className={styles.check_label}>
                <input
                  type="checkbox"
                  checked={settings.permissions.level.enabled}
                  className={styles.check_input}
                  onChange={(e) =>
                    dispatch({
                      type: "setPermissionsLevelEnabled",
                      payload: e.target.checked,
                    })
                  }
                />
                Minimum Fan Level
              </label>
            </div>

            <div style={{ display: "flex", alignItems: "center" }}>
              <input
                type="number"
                min="0"
                className={`${styles.input_style} ${styles.check_input_number}`}
                style={{
                  opacity: settings.permissions.level.enabled ? 1 : 0,
                  pointerEvents: settings.permissions.level.enabled
                    ? "auto"
                    : "none",
                }}
                value={settings.permissions.level.value}
                onChange={(e) =>
                  dispatch({
                    type: "setPermissionsLevelValue",
                    payload: Number(e.target.value),
                  })
                }
                disabled={!settings.permissions.level.enabled}
              />
            </div>
          </div>

          <div style={{ marginTop: "16px" }}>
            <label className={styles.check_label}>
              <input
                type="checkbox"
                checked={settings.permissions.list.enabled}
                className={styles.check_input}
                onChange={(e) =>
                  dispatch({
                    type: "setPermissionsListEnabled",
                    payload: e.target.checked,
                  })
                }
              />
              Enable Whitelist / Blacklist
            </label>

            {settings.permissions.list.enabled && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "24px",
                  marginTop: "24px",
                }}
              >
                <div>
                  <label className={styles.label_title}>
                    Whitelist{" "}
                    <span className={styles.secondary_text}>
                      (comma separated)
                    </span>
                  </label>
                  <textarea
                    className={`${styles.input_style} ${styles.text_area_input}`}
                    placeholder="Nickname1, Nickname2, Nickname3, ..."
                    value={whitelistTemp}
                    onChange={(e) => {
                      dispatch({
                        type: "setPermissionsListWhiteTemp",
                        payload: e.target.value,
                      });
                      const cleanedArray = e.target.value
                        .split(",")
                        .map((v) => v.trim())
                        .filter((v) => v !== "");

                      dispatch({
                        type: "setPermissionsListWhite",
                        payload: cleanedArray,
                      });
                    }}
                  />
                </div>
                <div>
                  <label className={styles.label_title}>
                    Blacklist{" "}
                    <span className={styles.secondary_text}>
                      (comma separated)
                    </span>
                  </label>
                  <textarea
                    className={`${styles.input_style} ${styles.text_area_input}`}
                    placeholder="Nickname1, Nickname2, Nickname3, ..."
                    value={blacklistTemp}
                    onChange={(e) => {
                      dispatch({
                        type: "setPermissionsListBlackTemp",
                        payload: e.target.value,
                      });
                      const cleanedArray = e.target.value
                        .split(",")
                        .map((v) => v.trim())
                        .filter((v) => v !== "");

                      dispatch({
                        type: "setPermissionsListBlack",
                        payload: cleanedArray,
                      });
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* --- PROTECTION --- */}
        <div className={styles.section}>
          <div>
            <h2 className={styles.section_header}>Protection</h2>
          </div>

          <div className={styles.protection_input_group}>
            <div>
              <label className={styles.label_title}>
                Cooldown{" "}
                <span className={styles.secondary_text}>(seconds)</span>
              </label>
              <input
                type="number"
                className={styles.input_style}
                value={settings.protection.cooldown}
                onChange={(e) =>
                  dispatch({
                    type: "setProtectionCooldown",
                    payload: Number(e.target.value),
                  })
                }
              />
            </div>
            <div>
              <label className={styles.label_title}>Max Queue Length</label>
              <input
                type="number"
                className={styles.input_style}
                value={settings.protection.queue_length}
                onChange={(e) =>
                  dispatch({
                    type: "setProtectionQueueLength",
                    payload: Number(e.target.value),
                  })
                }
              />
            </div>
          </div>

          <div>
            <label className={styles.label_title}>
              Max Comment Length{" "}
              <span className={styles.secondary_text}>(characters)</span>
            </label>
            <input
              type="number"
              className={styles.input_style}
              style={{ maxWidth: "calc(50% - 12px)" }}
              value={settings.protection.comment_length}
              onChange={(e) =>
                dispatch({
                  type: "setProtectionCommentLength",
                  payload: Number(e.target.value),
                })
              }
            />
          </div>

          <div>
            <label className={styles.label_title}>
              Banned Words Filter{" "}
              <span className={styles.secondary_text}>(comma separated)</span>
            </label>
            <textarea
              placeholder="word1, word2, word3..."
              className={`${styles.input_style} ${styles.text_area_input}`}
              value={bannedlistTemp}
              onChange={(e) => {
                dispatch({
                  type: "setProtectionBannedTemp",
                  payload: e.target.value,
                });
                const cleanedArray = e.target.value
                  .split(",")
                  .map((v) => v.trim())
                  .filter((v) => v !== "");

                dispatch({
                  type: "setProtectionBanned",
                  payload: cleanedArray,
                });
              }}
            />
          </div>
        </div>

        {/* --- REPLACEMENTS --- */}
        <div className={styles.replacement_container}>
          <div className={styles.replacement_header}>
            <div>
              <h2 className={styles.section_header}>Replacements</h2>
              <p className={styles.section_description}>
                Force the engine to pronounce acronyms or slang correctly.
              </p>
            </div>
            <button
              onClick={() =>
                dispatch({
                  type: "AddReplacements",
                  payload: { old: "", new: "" },
                })
              }
              className={styles.replacement_add_btn}
              title="Add Replacement"
            >
              <FiPlus size={24} />
            </button>
          </div>

          <div className={styles.replacement_section}>
            {settings.replacements.map((replacement, index) => (
              <div key={index} className={styles.replacement_section_item}>
                <input
                  type="text"
                  className={styles.input_style}
                  placeholder="Word to replace (e.g. 'brb')"
                  style={{ flex: 1 }}
                  value={replacement.old}
                  onChange={(e) => {
                    const newCustom = [...settings.replacements];
                    newCustom[index] = {
                      ...newCustom[index],
                      old: e.target.value,
                    };
                    dispatch({ type: "setReplacements", payload: newCustom });
                  }}
                />
                <span className={styles.replacement_section_item_sep}>
                  <FiArrowRight size={16} />
                </span>
                <input
                  type="text"
                  className={styles.input_style}
                  placeholder="How it sounds (e.g. 'be right back')"
                  style={{ flex: 1 }}
                  value={replacement.new}
                  onChange={(e) => {
                    const newCustom = [...settings.replacements];
                    newCustom[index] = {
                      ...newCustom[index],
                      new: e.target.value,
                    };
                    dispatch({ type: "setReplacements", payload: newCustom });
                  }}
                />
                <button
                  onClick={() => {
                    const newCustom = settings.replacements.filter(
                      (_, i) => i !== index,
                    );
                    dispatch({ type: "setReplacements", payload: newCustom });
                  }}
                  className={styles.replacement_remove_btn}
                  title="Remove"
                >
                  <FiTrash2 size={18} />
                </button>
              </div>
            ))}

            {settings.replacements.length === 0 && (
              <div className={styles.replacement_empty_list}>
                No custom replacements added.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
