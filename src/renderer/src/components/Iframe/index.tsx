import { useMemo, useState } from "react";
import { PropagateLoader } from "react-spinners";
import styles from "./iframe.module.css";

interface IframeProps {
  source: string;
  name: string;
}

export const Iframe = ({ source, name }: IframeProps) => {
  const [loading, setLoading] = useState(true);

  const iframeSrc = useMemo(() => {
    if (!source) return "";

    if (source.startsWith("http://") || source.startsWith("https://")) {
      return source;
    }

    const normalizedPath = source.replace(/\\/g, "/");

    const pathWithSlash = normalizedPath.startsWith("/")
      ? normalizedPath
      : `/${normalizedPath}`;

    return `local-resource://${encodeURI(pathWithSlash)}`;
  }, [source]);

  if (!source) {
    return <div>No source provided</div>;
  }

  return (
    <>
      {loading && (
        <div className={styles.loading_container}>
          <PropagateLoader color="var(--accent-primary)" />
        </div>
      )}
      <iframe
        src={iframeSrc}
        title={`Viewer for ${name}`}
        name={`TOKIO_APP-${name}`}
        onLoad={() => {
          setLoading(false);
        }}
        className={styles.iframe_component}
        style={{
          visibility: loading ? "hidden" : "visible",
        }}
        sandbox="allow-scripts allow-same-origin"
      />
    </>
  );
};
