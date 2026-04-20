import { useEffect, useMemo, useRef, useState } from "react";

type WebcamRecorderProps = {
  onRecordingReady: (file: File | null) => void;
};

const RECORDING_SECONDS = 5;

function getSupportedMimeType() {
  const candidates = [
    "video/webm;codecs=vp8",
    "video/webm;codecs=vp9",
    "video/webm",
  ];

  return candidates.find(
    (mimeType) =>
      typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(mimeType),
  );
}

export function WebcamRecorder({ onRecordingReady }: Readonly<WebcamRecorderProps>) {
  const liveVideoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RECORDING_SECONDS);

  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((track) => track.stop());
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl, stream]);

  useEffect(() => {
    if (liveVideoRef.current && stream) {
      liveVideoRef.current.srcObject = stream;
    }
  }, [stream]);

  const supportedMimeType = useMemo(getSupportedMimeType, []);

  const enableCamera = async () => {
    setError("");

    try {
      const nextStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      setStream((current) => {
        current?.getTracks().forEach((track) => track.stop());
        return nextStream;
      });
    } catch {
      setError("Impossible d'acceder a la webcam. Verifiez les permissions navigateur.");
    }
  };

  const startRecording = async () => {
    let activeStream = stream;

    if (!activeStream) {
      try {
        activeStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        });
        setStream(activeStream);
      } catch {
        setError("Impossible d'activer la webcam.");
        return;
      }
    }

    setError("");
    setIsRecording(true);
    setSecondsLeft(RECORDING_SECONDS);
    onRecordingReady(null);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
    }

    const chunks: Blob[] = [];
    let recorder: MediaRecorder;

    try {
      recorder = supportedMimeType
        ? new MediaRecorder(activeStream, { mimeType: supportedMimeType })
        : new MediaRecorder(activeStream);
    } catch {
      setIsRecording(false);
      setSecondsLeft(RECORDING_SECONDS);
      setError("L'enregistrement webcam n'est pas supporte par ce navigateur.");
      return;
    }

    const countdown = globalThis.setInterval(() => {
      setSecondsLeft((current) => (current > 1 ? current - 1 : 1));
    }, 1000);

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    recorder.onerror = () => {
      globalThis.clearInterval(countdown);
      setIsRecording(false);
      setSecondsLeft(RECORDING_SECONDS);
      setError("La capture webcam a echoue. Reessayez apres avoir reactive la webcam.");
      onRecordingReady(null);
    };

    recorder.onstop = () => {
      globalThis.clearInterval(countdown);
      setIsRecording(false);
      setSecondsLeft(RECORDING_SECONDS);

      if (chunks.length === 0) {
        setError("Aucune donnee video capturee. Verifiez la webcam puis recommencez.");
        onRecordingReady(null);
        return;
      }

      const containerMimeType = supportedMimeType?.split(";")[0] ?? "video/webm";
      const blob = new Blob(chunks, { type: containerMimeType });

      if (blob.size === 0) {
        setError("Capture video invalide (taille nulle). Reessayez l'enregistrement.");
        onRecordingReady(null);
        return;
      }

      const file = new File([blob], `webcam-proof-${Date.now()}.webm`, {
        type: containerMimeType,
      });
      const nextPreviewUrl = URL.createObjectURL(blob);
      setPreviewUrl(nextPreviewUrl);
      onRecordingReady(file);
    };

    recorder.start(1000);
    globalThis.setTimeout(() => {
      if (recorder.state !== "inactive") {
        recorder.stop();
      }
    }, RECORDING_SECONDS * 1000);
  };

  return (
    <div className="webcam-recorder">
      <div className="webcam-actions">
        <button className="ghost-button" onClick={enableCamera} type="button">
          Activer la webcam
        </button>
        <button
          className="primary-button"
          disabled={isRecording}
          onClick={startRecording}
          type="button"
        >
          {isRecording ? `Enregistrement ${secondsLeft}s` : "Enregistrer 5 secondes"}
        </button>
      </div>

      <div className="webcam-grid">
        <div className="webcam-panel">
          <h4>Apercu direct</h4>
          <video autoPlay className="video-player" muted playsInline ref={liveVideoRef} />
        </div>

        <div className="webcam-panel">
          <h4>Dernier enregistrement</h4>
          {previewUrl ? (
            <video className="video-player" controls playsInline src={previewUrl}>
              <track kind="captions" />
            </video>
          ) : (
            <div className="video-placeholder">
              Enregistrez 5 secondes de webcam pour joindre la preuve video au message.
            </div>
          )}
        </div>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      <p className="form-hint">
        La capture webcam dure exactement 5 secondes et sert de preuve video d'emission.
      </p>
    </div>
  );
}
