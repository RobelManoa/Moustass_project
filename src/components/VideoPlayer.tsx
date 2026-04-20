import { useEffect, useState } from "react";

import { fetchVideoBlob, getApiErrorMessage } from "../api/api";

export default function VideoPlayer({ id }: { id: string }) {
  const [videoUrl, setVideoUrl] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let revokedUrl = "";
    let isMounted = true;

    async function loadVideo() {
      setIsLoading(true);
      setError("");

      try {
        const blob = await fetchVideoBlob(id);
        revokedUrl = URL.createObjectURL(blob);

        if (isMounted) {
          setVideoUrl(revokedUrl);
        }
      } catch (err) {
        if (isMounted) {
          setError(getApiErrorMessage(err));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadVideo();

    return () => {
      isMounted = false;
      if (revokedUrl) {
        URL.revokeObjectURL(revokedUrl);
      }
    };
  }, [id]);

  if (isLoading) {
    return <div className="video-placeholder">Chargement securise de la video...</div>;
  }

  if (error) {
    return <div className="video-error">{error}</div>;
  }

  return (
    <video className="video-player" controls preload="metadata">
      <source src={videoUrl} />
      Votre navigateur ne peut pas lire cette video.
    </video>
  );
}
