import { OverlayApp } from "@/common/types";
import copy from "copy-to-clipboard";
import { FaRegCopy } from "react-icons/fa";
import { GoUnverified, GoVerified } from "react-icons/go";
import { PiShootingStarThin } from "react-icons/pi";
import { VscPackage, VscSettings } from "react-icons/vsc";
import { Iframe } from "../Iframe";
import styles from "./overlayview.module.css";

const getUrl = (id: string) => `http://tokio-app.local:37891/${id}`;

interface Props {
  onTest: (id: string) => void;
  onCustomize: (id: string) => void;
  overlay: OverlayApp;
  width: string;
  height: string;
}

export function OverlayView({
  onTest,
  onCustomize,
  overlay,
  width,
  height,
}: Props) {
  return (
    <div className={styles.container}>
      <div className={styles.info}>
        <h3 className={styles.title}>{overlay.name}</h3>
        <div className={styles.tags}>
          <span className={styles.tag}>
            <VscPackage size={16} />
            {overlay.version}
          </span>
          {overlay.external ? (
            <span className={styles.tag}>
              <GoUnverified size={16} />
              External
            </span>
          ) : (
            <span className={styles.tag}>
              <GoVerified size={16} color="green" />
              Verified
            </span>
          )}
        </div>
      </div>
      <div className={styles.header_controls}>
        <div className={styles.url_group}>
          <input
            type="url"
            className={styles.input_style}
            disabled
            value={getUrl(overlay.id)}
          />
          <button
            className={styles.action_btn}
            style={{ padding: "2px 8px" }}
            onClick={() => {
              copy(getUrl(overlay.id));
            }}
          >
            <FaRegCopy size={18} />
          </button>
        </div>
        <div className={styles.button_group}>
          <button
            className={styles.action_btn}
            onClick={() => onTest(overlay.id)}
          >
            <PiShootingStarThin size={20} />
            Test
          </button>
          {overlay.config && (
            <button
              className={styles.action_btn}
              onClick={() => onCustomize(overlay.id)}
            >
              <VscSettings size={20} />
              Customize
            </button>
          )}
        </div>
      </div>
      <div className={styles.frame} style={{ width, height }}>
        <Iframe name={overlay.id} source={overlay.path} />
      </div>
    </div>
  );
}
