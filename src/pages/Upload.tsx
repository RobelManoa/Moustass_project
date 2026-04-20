import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  fetchMessageRecipients,
  getApiErrorMessage,
  MessageParticipant,
  uploadMessage,
} from "../api/api";
import { WebcamRecorder } from "../components/WebcamRecorder";
import { useEffect } from "react";

export default function Upload() {
  const navigate = useNavigate();
  const [recipientId, setRecipientId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [recipients, setRecipients] = useState<MessageParticipant[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchMessageRecipients()
      .then((items) => {
        setRecipients(items);
        setRecipientId(items[0]?.id ?? "");
      })
      .catch((err) => setError(getApiErrorMessage(err)));
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!file) {
      setError("Enregistrez d'abord la sequence webcam de 5 secondes.");
      return;
    }

    if (!recipientId) {
      setError("Choisissez un destinataire.");
      return;
    }

    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      await uploadMessage({
        file,
        recipientId,
        title,
        description,
      });

      setSuccess("Message envoye avec sa preuve webcam. Signature et stockage termines.");
      setRecipientId(recipients[0]?.id ?? "");
      setTitle("");
      setDescription("");
      setFile(null);

      window.setTimeout(() => {
        navigate("/messages");
      }, 900);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-stack">
      <section className="page-hero">
        <div>
          <p className="hero-chip">Composition securisee</p>
          <h2>Composer un message video authentifie</h2>
          <p className="page-copy">
            Rédigez le message, choisissez le destinataire puis enregistrez 5
            secondes de webcam pour joindre une preuve video d'emission.
          </p>
        </div>
      </section>

      <section className="panel upload-panel">
        <form className="upload-form" onSubmit={handleSubmit}>
          <label>
            Destinataire
            <select
              onChange={(event) => setRecipientId(event.target.value)}
              required
              value={recipientId}
            >
              <option value="">Selectionner un destinataire</option>
              {recipients.map((recipient) => (
                <option key={recipient.id} value={recipient.id}>
                  {recipient.name || recipient.email} ({recipient.email})
                </option>
              ))}
            </select>
          </label>

          <label>
            Objet du message
            <input
              minLength={3}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ex: Briefing confidentiel du lundi"
              required
              type="text"
              value={title}
            />
          </label>

          <label>
            Message
            <textarea
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Ecrivez le contenu du message qui accompagne la preuve webcam."
              rows={5}
              value={description}
            />
          </label>

          <div className="file-dropzone">
            <span>Preuve webcam de l'emetteur</span>
            <WebcamRecorder onRecordingReady={setFile} />
            <strong>{file ? file.name : "Aucune capture 5 secondes enregistree"}</strong>
            <small>Le fichier genere est envoye comme preuve video du message.</small>
          </div>

          {error ? <p className="form-error">{error}</p> : null}
          {success ? <p className="form-success">{success}</p> : null}

          <div className="form-actions">
            <button className="primary-button" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Envoi..." : "Envoyer le message"}
            </button>
            <button
              className="ghost-button"
              onClick={() => navigate("/messages")}
              type="button"
            >
              Retour aux messages
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
