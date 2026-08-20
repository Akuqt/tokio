import { MouseEvent, useEffect, useState } from "react";
import { VscChromeClose } from "react-icons/vsc";
import Logo from "../assets/logo.png";
import styles from "./app.module.css";
import { InstallerStep, parseData } from "./helper";

export default function App() {
  const [step, setStep] = useState<InstallerStep>("welcome");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Initializing...");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    window.installer.receiveMessage((jsonString: string) => {
      const data = parseData(jsonString);

      if (data.Type === "STATE") {
        const { Progress, State, Message } = data.Value;

        if (Progress !== undefined) setProgress(Progress);

        switch (State) {
          case "downloading":
            setStep("downloading");
            setStatus("Downloading...");
            break;
          case "installing":
            setStep("installing");
            setStatus("Installing...");
            break;
          case "complete":
            setStep("complete");
            setStatus("Completed...");
            break;
          case "error":
            setStep("error");
            setError(
              Message || "There was an error while trying to install the app.",
            );
            break;
        }
      } else if (data.Type === "NON_FOUND") {
        console.error("Failed to parse message from C#:", jsonString);
      }
    });

    window.installer.sendMessage("UI_READY");
  }, []);

  const handleWindowDrag = (e: MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const isInteractiveElement =
      target.tagName === "BUTTON" ||
      target.tagName === "INPUT" ||
      target.closest("button") ||
      target.closest("input");

    if (!isInteractiveElement) {
      window.installer.sendMessage("DRAG");
    }
  };

  const handleClose = () => window.installer.sendMessage("CLOSE");

  const handleInstall = () => {
    setStep("initializing");
    window.installer.sendMessage("INSTALL");
  };

  const handleLaunch = () => window.installer.sendMessage("LAUNCH");

  const renderActionContent = () => {
    switch (step) {
      case "welcome":
        return (
          <button className={styles.welcome_btn} onClick={handleInstall}>
            Install
          </button>
        );
      case "error":
        return (
          <p className={`${styles.description} ${styles.error_text}`}>
            {error}
          </p>
        );
      case "complete":
        return (
          <button className={styles.welcome_btn} onClick={handleLaunch}>
            Start
          </button>
        );
      default:
        return <p className={styles.status_text}>{status}</p>;
    }
  };

  const isProcessing = step === "downloading" || step === "installing";

  return (
    <div className={styles.container} onMouseDown={handleWindowDrag}>
      {step !== "installing" && (
        <button
          className={styles.close_btn}
          onClick={handleClose}
          title="Close"
        >
          <VscChromeClose size={18} />
        </button>
      )}
      <div className={styles.glow_wrapper}>
        <div className={styles.content_wrapper}>
          <div className={styles.step_container}>
            <div className={styles.welcome_content}>
              <div className={styles.app_name}>
                <h1>Tok</h1>
                <h1 className={styles.accent_red}>io</h1>
              </div>

              <div className={styles.logo}>
                <img src={Logo} alt="Tokio Logo" />
              </div>

              <div className={styles.conditional}>
                {renderActionContent()}
                {isProcessing && (
                  <div className={styles.progress_container}>
                    {step === "installing" ? (
                      <div className={styles.progress_indeterminate} />
                    ) : (
                      <div
                        className={styles.progress_fill}
                        style={{ width: `${progress}%` }}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className={styles.footer}>
              <span className={styles.version}>Installer v0.0.1</span>
              <span className={styles.disclaimer}>
                Not affiliated with, endorsed by, or associated with TikTok or
                ByteDance Ltd.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
