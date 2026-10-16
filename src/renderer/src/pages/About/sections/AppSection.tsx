import Logo from "@/assets/logo.png";
import { AboutInfo } from "@/common/types";
import { REPOSITORY_URL } from "@/common/util";
import { Btn, Section } from "@/components";
import { FiCode, FiFileText } from "react-icons/fi";
import styles from "../about.module.css";
import { COPYRIGHT } from "../helper";

type Props = {
  versions?: AboutInfo["versions"];
  onView: (id: string) => void;
};

export function AppSection({ versions, onView }: Props) {
  return (
    <Section>
      <div className={styles.app}>
        <img className={styles.logo} src={Logo} alt="" />
        <div className={styles.app_info}>
          <h3 className={styles.app_name}>Tokio</h3>
          <p className={styles.muted}>
            Version {__APP_VERSION__}
            {versions &&
              ` · Electron ${versions.electron} · Chromium ${versions.chrome} · Node ${versions.node}`}
          </p>
          <p className={styles.muted}>{COPYRIGHT}</p>
        </div>
      </div>

      <div className={styles.notice}>
        <p>
          Tokio is free software. The application includes components licensed
          under the GNU Affero General Public License v3.0, so it&apos;s
          distributed under that license (AGPL-3.0-only): you may redistribute
          and modify it under its terms. Tokio&apos;s own source code is also
          available under the MIT License.
        </p>
        <p>
          Tokio comes with <strong>absolutely no warranty</strong>, to the
          extent permitted by applicable law. See the license for details.
        </p>
        <p>
          The complete source code of every release is published at{" "}
          <a href={REPOSITORY_URL} target="_blank" rel="noreferrer">
            {REPOSITORY_URL.replace(/^https:\/\//, "")}
          </a>
          .
        </p>
      </div>

      <div className={styles.buttons}>
        <Btn onClick={() => window.open(REPOSITORY_URL)}>
          <FiCode /> Source code
        </Btn>
        <Btn onClick={() => onView("AGPL-3.0")}>
          <FiFileText /> AGPL-3.0 license
        </Btn>
        <Btn onClick={() => onView("tokio")}>
          <FiFileText /> MIT license
        </Btn>
        <Btn onClick={() => onView("notices")}>
          <FiFileText /> Third-party notices
        </Btn>
      </div>
    </Section>
  );
}
