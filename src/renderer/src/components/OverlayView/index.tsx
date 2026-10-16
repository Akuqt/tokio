import { OverlayApp } from "@/common/types";
import { getOverlayURL } from "@/common/util";
import copy from "copy-to-clipboard";
import { FaRegCopy } from "react-icons/fa";
import { GoUnverified, GoVerified } from "react-icons/go";
import { PiShootingStarThin } from "react-icons/pi";
import { VscPackage, VscSettings } from "react-icons/vsc";
import { Btn, Input } from "../Elements";
import { Iframe } from "../Iframe";
import styles from "./overlayview.module.css";

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
  const url = getOverlayURL(overlay.id);

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
              <GoVerified size={16} color="var(--success)" />
              Verified
            </span>
          )}
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.url_group}>
          <Input type="url" readOnly value={url} className={styles.url} />
          <Btn title="Copy URL" onClick={() => copy(url)}>
            <FaRegCopy size={18} />
          </Btn>
        </div>
        <div className={styles.buttons}>
          <Btn onClick={() => onTest(overlay.id)}>
            <PiShootingStarThin size={20} />
            Test
          </Btn>
          {overlay.config && (
            <Btn onClick={() => onCustomize(overlay.id)}>
              <VscSettings size={20} />
              Customize
            </Btn>
          )}
        </div>
      </div>

      <div className={styles.frame} style={{ width, height }}>
        <Iframe name={overlay.id} source={overlay.path} />
      </div>
    </div>
  );
}
