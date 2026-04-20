import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  deleteMessage,
  fetchMessageDetails,
  fetchMessageRecipients,
  fetchMessagesWithQuery,
  getApiErrorMessage,
  MessageDetails,
  MessageParticipant,
  VideoMessage,
} from "../api/api";
import { useAuth } from "../auth";
import VideoPlayer from "../components/VideoPlayer";

export default function Messages() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<VideoMessage[]>([]);
  const [recipients, setRecipients] = useState<MessageParticipant[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<MessageDetails | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState("");
  const [box, setBox] = useState<"all" | "sent" | "inbox">("all");
  const [query, setQuery] = useState("");
  const [participantId, setParticipantId] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 6,
    total: 0,
    totalPages: 1,
  });

  const loadMessages = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const result = await fetchMessagesWithQuery({
        box,
        q: query,
        page,
        perPage: 6,
        recipientId: box === "sent" && participantId ? participantId : undefined,
        senderId: box === "inbox" && participantId ? participantId : undefined,
      });

      setMessages(result.messages);
      setPagination({
        page: result.page,
        perPage: result.perPage,
        total: result.total,
        totalPages: result.totalPages,
      });
      setSelectedId((current) =>
        current && result.messages.some((message) => message.id === current)
          ? current
          : result.messages[0]?.id || "",
      );
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [box, page, participantId, query]);

  useEffect(() => {
    fetchMessageRecipients()
      .then(setRecipients)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (!selectedId) {
      setSelectedMessage(null);
      return;
    }

    setIsLoadingDetails(true);
    fetchMessageDetails(selectedId)
      .then(setSelectedMessage)
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setIsLoadingDetails(false));
  }, [selectedId]);

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      "Supprimer cette video de l'espace client ? Cette action est irreversible.",
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(id);

    try {
      await deleteMessage(id);
      await loadMessages();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsDeleting("");
    }
  };

  const participantOptions = useMemo(() => {
    if (box === "sent") {
      return recipients;
    }

    if (box === "inbox") {
      const uniqueSenders = new Map<string, MessageParticipant>();
      messages.forEach((message) => {
        if (message.sender) {
          uniqueSenders.set(message.sender.id, message.sender);
        }
      });
      return Array.from(uniqueSenders.values());
    }

    return recipients;
  }, [box, messages, recipients]);

  return (
    <div className="page-stack">
      <section className="page-hero">
        <div>
          <p className="hero-chip">Espace personnel securise</p>
          <h2>Bonjour {user?.name || user?.email}</h2>
          <p className="page-copy">
            Retrouvez vos videos signees, consultez leur empreinte et lisez-les
            depuis une session authentifiee.
          </p>
        </div>
        <div className="hero-actions">
          <Link className="primary-button button-link" to="/compose">
            Composer un message
          </Link>
          <button className="ghost-button" onClick={loadMessages} type="button">
            Actualiser
          </button>
        </div>
      </section>

      <section className="metrics-grid">
        <article className="stat-card">
          <span>Messages sur cette page</span>
          <strong>{messages.length}</strong>
        </article>
        <article className="stat-card">
          <span>Role</span>
          <strong>{user?.role ?? "USER"}</strong>
        </article>
        <article className="stat-card">
          <span>Total filtre</span>
          <strong>{pagination.total}</strong>
        </article>
      </section>

      {error ? <div className="feedback-card error">{error}</div> : null}

      <section className="content-grid">
        <div className="panel">
          <div className="panel-header">
            <h3>Boite de messagerie</h3>
            <span>
              {isLoading ? "Chargement..." : `Page ${pagination.page}/${pagination.totalPages}`}
            </span>
          </div>

          <div className="filters-grid">
            <label>
              Boite
              <select
                onChange={(event) => {
                  setBox(event.target.value as "all" | "sent" | "inbox");
                  setParticipantId("");
                  setPage(1);
                }}
                value={box}
              >
                <option value="all">Tous</option>
                <option value="inbox">Recus</option>
                <option value="sent">Envoyes</option>
              </select>
            </label>

            <label>
              Recherche
              <input
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="Titre, texte, fichier, participant..."
                value={query}
              />
            </label>

            <label>
              {box === "sent" ? "Destinataire" : box === "inbox" ? "Expediteur" : "Participant"}
              <select
                onChange={(event) => {
                  setParticipantId(event.target.value);
                  setPage(1);
                }}
                value={participantId}
              >
                <option value="">Tous</option>
                {participantOptions.map((participant) => (
                  <option key={participant.id} value={participant.id}>
                    {participant.name || participant.email}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {isLoading ? (
            <div className="empty-state">Chargement des messages...</div>
          ) : messages.length === 0 ? (
            <div className="empty-state">
              <p>Aucun message ne correspond aux filtres courants.</p>
              <Link className="primary-button button-link" to="/compose">
                Composer le premier message
              </Link>
            </div>
          ) : (
            <div className="message-list">
              {messages.map((message) => (
                <button
                  className={`message-card ${
                    selectedMessage?.id === message.id ? "active" : ""
                  }`}
                  key={message.id}
                  onClick={() => setSelectedId(message.id)}
                  type="button"
                >
                  <div>
                    <h4>{message.title}</h4>
                    <p>{message.description || "Aucune description"}</p>
                  </div>
                  <div className="message-meta">
                    <span>
                      {message.direction === "sent"
                        ? `Vers ${message.recipient?.name || message.recipient?.email || "Inconnu"}`
                        : `De ${message.sender?.name || message.sender?.email || "Inconnu"}`}
                    </span>
                    <span>{new Date(message.createdAt).toLocaleString()}</span>
                    <span>{message.originalFileName}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="pagination-bar">
            <button
              className="ghost-button"
              disabled={pagination.page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              type="button"
            >
              Precedent
            </button>
            <span>
              {pagination.total} resultat(s) · page {pagination.page} / {pagination.totalPages}
            </span>
            <button
              className="ghost-button"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() =>
                setPage((current) => Math.min(pagination.totalPages, current + 1))
              }
              type="button"
            >
              Suivant
            </button>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h3>Lecture et preuve cryptographique</h3>
            {selectedMessage?.canDelete ? (
              <button
                className="ghost-button danger"
                disabled={isDeleting === selectedMessage.id}
                onClick={() => handleDelete(selectedMessage.id)}
                type="button"
              >
                {isDeleting === selectedMessage.id ? "Suppression..." : "Supprimer"}
              </button>
            ) : null}
          </div>

          {isLoadingDetails ? (
            <div className="empty-state">Chargement du detail du message...</div>
          ) : selectedMessage ? (
            <div className="video-panel">
              <VideoPlayer id={selectedMessage.id} />
              <div className="video-details">
                <h4>{selectedMessage.title}</h4>
                <p>{selectedMessage.description || "Aucune description fournie."}</p>
                <dl>
                  <div>
                    <dt>Fichier</dt>
                    <dd>{selectedMessage.originalFileName}</dd>
                  </div>
                  <div>
                    <dt>Type</dt>
                    <dd>{selectedMessage.mimeType}</dd>
                  </div>
                  <div>
                    <dt>Expediteur</dt>
                    <dd>
                      {selectedMessage.sender?.name || selectedMessage.sender?.email || "Inconnu"}
                    </dd>
                  </div>
                  <div>
                    <dt>Destinataire</dt>
                    <dd>
                      {selectedMessage.recipient?.name ||
                        selectedMessage.recipient?.email ||
                        "Inconnu"}
                    </dd>
                  </div>
                  <div>
                    <dt>SHA-256</dt>
                    <dd className="hash-value">{selectedMessage.mediaSha256}</dd>
                  </div>
                  <div>
                    <dt>Signature</dt>
                    <dd>{selectedMessage.signatureValid ? "Valide" : "Invalide"}</dd>
                  </div>
                </dl>
              </div>

              <div className="manifest-panel">
                <div className="panel-header">
                  <h3>Manifest signe</h3>
                  <span>{selectedMessage.manifest.recordingDurationSeconds}s webcam</span>
                </div>
                <pre>{JSON.stringify(selectedMessage.manifest, null, 2)}</pre>
                <h4>Signature RSA-PSS</h4>
                <p className="hash-value">{selectedMessage.mediaSignature}</p>
              </div>
            </div>
          ) : (
            <div className="empty-state">Selectionnez un message pour le lire.</div>
          )}
        </div>
      </section>
    </div>
  );
}
