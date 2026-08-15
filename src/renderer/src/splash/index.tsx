import { BarLoader } from "react-spinners";
import styles from "./loader.module.css";

export function SplashScreen() {
  return (
    <div className={styles.container}>
      <div className={styles.glow_wrapper}>
        <div className={styles.content}>
          <div className={styles.app_name}>
            <h1>Tok</h1>
            <h1 className={styles.accent_pink}>i</h1>
            <h1 className={styles.accent_blue}>o</h1>
          </div>

          <div className={styles.loading}>
            <BarLoader color="#a0a0a0" width={150} height={3} />
            <span className={styles.status_text}>Starting up...</span>
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <span className={styles.version}>v1.0.0</span>
        <span className={styles.disclaimer}>
          Not affiliated with, endorsed by, or associated with TikTok or
          ByteDance Ltd.
        </span>
      </div>
    </div>
  );
}
