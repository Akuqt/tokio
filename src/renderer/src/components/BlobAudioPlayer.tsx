import { useEffect, useState } from "react";

const BlobAudioPlayer = ({ base64String, mimeType = "audio/mp3" }) => {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    // Make sure we have a string to work with
    if (!base64String) return;

    const createAudioBlob = () => {
      try {
        // 1. Decode base64 to a raw binary string
        // Note: This assumes base64String is JUST the base64 data,
        // without the "data:audio/mp3;base64," prefix.
        const byteCharacters = atob(base64String);

        // 2. Create an array of byte values
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }

        // 3. Convert to a typed array
        const byteArray = new Uint8Array(byteNumbers);

        // 4. Create the Blob and Object URL
        const blob = new Blob([byteArray], { type: mimeType });
        const url = URL.createObjectURL(blob);

        setAudioUrl(url);
      } catch (error) {
        console.error("Error decoding base64 audio:", error);
      }
    };

    createAudioBlob();

    // Cleanup function to prevent memory leaks
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [base64String, mimeType]);

  return (
    <div>
      <h3>Electron-Safe Blob Player</h3>
      {audioUrl ? (
        <audio controls src={audioUrl}>
          Your browser does not support the audio element.
        </audio>
      ) : (
        <p>Loading audio...</p>
      )}
    </div>
  );
};

export default BlobAudioPlayer;
