import { ClipLoader } from "react-spinners";

const SPINNER_STYLE = { margin: 4, padding: 0 };

export function Spinner({ size = 16 }: { size?: number }) {
  return (
    <ClipLoader size={size} color="currentColor" cssOverride={SPINNER_STYLE} />
  );
}
