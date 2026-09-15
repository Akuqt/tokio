import { useMemo } from "react";

interface IframeProps {
  source: string;
  name: string;
}

export const Iframe = ({ source, name }: IframeProps) => {
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
    <iframe
      src={iframeSrc}
      title={`Viewer for ${name}`}
      name={`TOKIO_APP-${name}`}
      style={{
        width: "100%",
        height: "100%",
        border: "none",
        outline: "none",
        userSelect: "none",
        pointerEvents: "none",
        backgroundColor: "transparent",
      }}
      sandbox="allow-scripts allow-same-origin"
    />
  );
};
