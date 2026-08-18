import { VoiceData } from "@/common/types";
import { useEffect, useRef, useState } from "react";
import { FiChevronDown, FiSearch } from "react-icons/fi";
import styles from "./voicedropdown.module.css";

interface Props {
  voices: VoiceData[];
  current: VoiceData;
  onChange: (voice: VoiceData) => void;
}

export function VoiceDropdown({ voices, onChange, current }: Props) {
  const [currentVoice, setCurrentVoice] = useState(current);
  const [isVoiceDropdownOpen, setIsVoiceDropdownOpen] = useState(false);
  const [voiceSearch, setVoiceSearch] = useState("");
  const voiceDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentVoice(current);
  }, [current]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        voiceDropdownRef.current &&
        !voiceDropdownRef.current.contains(event.target as Node)
      ) {
        setIsVoiceDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredVoices = voices.filter(
    (v) =>
      v.lang.toLowerCase().includes(voiceSearch.toLowerCase()) ||
      v.name.toLowerCase().includes(voiceSearch.toLowerCase()),
  );

  const groupedVoices = filteredVoices.reduce(
    (acc, voice) => {
      if (!acc[voice.lang]) acc[voice.lang] = [];
      acc[voice.lang].push(voice);
      return acc;
    },
    {} as Record<string, VoiceData[]>,
  );
  return (
    <>
      <div style={{ position: "relative" }} ref={voiceDropdownRef}>
        <label className={styles.label_title}>Voice Selection</label>
        <div
          className={styles.input_style}
          onClick={() => setIsVoiceDropdownOpen(!isVoiceDropdownOpen)}
        >
          <span className={styles.voice_selected}>
            {currentVoice.lang} - {currentVoice.name}
          </span>
          <FiChevronDown />
        </div>

        {isVoiceDropdownOpen && (
          <div className={styles.dropdown_container}>
            <div className={styles.search_container}>
              <div className={styles.input_container}>
                <FiSearch color="var(--font-secondary)" />
                <input
                  type="text"
                  placeholder="Search language or voice..."
                  className={styles.input_style}
                  value={voiceSearch}
                  onChange={(e) => setVoiceSearch(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div className={styles.search_result_container}>
              {Object.entries(groupedVoices).length === 0 ? (
                <div className={styles.search_empty}>No voices found</div>
              ) : (
                Object.entries(groupedVoices).map(([category, voices]) => (
                  <div key={category} className={styles.search_result_section}>
                    <div className={styles.search_result}>{category}</div>
                    {voices.map((voice) => (
                      <div
                        key={`${voice.lang}-${voice.name}`}
                        onClick={() => {
                          onChange(voice);
                          setCurrentVoice(voice);
                          setIsVoiceDropdownOpen(false);
                        }}
                        className={styles.search_item}
                        style={{
                          backgroundColor:
                            currentVoice.name === voice.name &&
                            currentVoice.lang === voice.lang
                              ? "var(--background-secondary)"
                              : "transparent",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor =
                            "var(--background-primary)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor =
                            currentVoice.name === voice.name &&
                            currentVoice.lang === voice.lang
                              ? "var(--background-secondary)"
                              : "transparent";
                        }}
                      >
                        {voice.name}
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
