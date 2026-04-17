import { useState } from "react";
import { api } from "../api/api";

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    await api.post("/messages/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    alert("Upload réussi");
  };

  return (
    <div>
      <h2>Upload vidéo</h2>
      <input
        type="file"
        accept="video/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <button onClick={handleUpload}>Envoyer</button>
    </div>
  );
}