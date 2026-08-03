import { useEffect, useState } from "react";
import BlobAudioPlayer from "./components/BlobAudioPlayer";

function App() {
  const [username, setUsername] = useState("dessgameplays");
  const [listening, setlistening] = useState(false);
  const [b64audio, setB64audio] = useState<string | null>(null);

  const handleStart = async () => {
    if (!username.trim()) return;
    window.api.startListener(username.trim());
  };

  useEffect(() => {
    window.api.onListener(() => {
      setlistening(true);
    });
    window.api.onAudioData((base64String: string) => {
      console.log("Received audio data:", base64String);
      setB64audio(base64String);
    });
  }, []);

  return (
    <div
      style={{
        padding: "24px",
        fontFamily: "sans-serif",
        maxWidth: "800px",
        margin: "0 auto",
      }}
    >
      <h1>TikTok Live Dashboard</h1>

      {/* Stream Controls */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="TikTok Username (e.g. rewiss.fps)"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ flex: 1, padding: "8px 12px", fontSize: "14px" }}
        />
        <button
          onClick={handleStart}
          disabled={listening}
          style={{
            padding: "8px 16px",
          }}
        >
          Start Stream
        </button>
      </div>
      <BlobAudioPlayer base64String={b64audio} />
    </div>
  );
}

export default App;
