import axios from "axios";

const API_URL =
  process.env.REACT_APP_API_URL?.replace(/\/+$/, "") ?? "http://localhost:3001";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: "USER" | "ADMIN";
  createdAt?: string;
  updatedAt?: string;
};

export type MessageParticipant = {
  id: string;
  email: string;
  name: string;
  role: "USER" | "ADMIN";
};

export type ClientInfo = {
  client: string;
  version: string;
};

export type MessageManifest = {
  id: string;
  clientName: string;
  ownerId: string;
  recipientId: string | null;
  title: string;
  description: string | null;
  originalFileName: string;
  mimeType: string;
  size: number;
  mediaSha256: string;
  recordingDurationSeconds: number;
  uploadedAt: string;
};

export type VideoMessage = {
  id: string;
  ownerId: string;
  recipientId: string | null;
  title: string;
  description?: string | null;
  originalFileName: string;
  mimeType: string;
  mediaSha256: string;
  createdAt: string;
  updatedAt: string;
  direction: "sent" | "inbox" | "shared";
  sender: MessageParticipant | null;
  recipient: MessageParticipant | null;
  security: {
    signaturePresent: boolean;
    manifestPreview: MessageManifest;
  };
};

export type MessageDetails = VideoMessage & {
  manifest: MessageManifest;
  mediaSignature: string;
  signatureValid: boolean;
  canDelete: boolean;
};

export const api = axios.create({
  baseURL: API_URL,
});

const TOKEN_KEY = "moustass.client.token";

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  localStorage.removeItem(TOKEN_KEY);
  delete api.defaults.headers.common.Authorization;
}

setAuthToken(getStoredToken());

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      setAuthToken(null);
    }

    return Promise.reject(error);
  },
);

export async function fetchClientInfo() {
  const response = await api.get<ClientInfo>("/info");
  return response.data;
}

export async function login(credentials: { email: string; password: string }) {
  const response = await api.post<{ token: string; user: AuthUser }>(
    "/auth/login",
    credentials,
  );

  setAuthToken(response.data.token);
  return response.data;
}

export async function fetchMe() {
  const response = await api.get<{ user: AuthUser }>("/auth/me");
  return response.data.user;
}

export async function fetchMessages() {
  const response = await api.get<{
    messages: VideoMessage[];
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  }>("/messages");
  return response.data;
}

export async function fetchMessagesWithQuery(params: {
  box: "all" | "sent" | "inbox";
  q?: string;
  page: number;
  perPage: number;
  recipientId?: string;
  senderId?: string;
}) {
  const response = await api.get<{
    messages: VideoMessage[];
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  }>("/messages", { params });
  return response.data;
}

export async function fetchMessageRecipients() {
  const response = await api.get<{ recipients: MessageParticipant[] }>("/messages/recipients");
  return response.data.recipients;
}

export async function fetchMessageDetails(id: string) {
  const response = await api.get<{ message: MessageDetails }>(`/messages/${id}/details`);
  return response.data.message;
}

export async function uploadMessage(input: {
  file: File;
  recipientId: string;
  title: string;
  description?: string;
}) {
  const formData = new FormData();
  formData.append("file", input.file);
  formData.append("recipientId", input.recipientId);
  formData.append("title", input.title);

  if (input.description) {
    formData.append("description", input.description);
  }

  const response = await api.post<{ message: VideoMessage }>("/messages/upload", formData);

  return response.data.message;
}

export async function deleteMessage(id: string) {
  await api.delete(`/messages/${id}`);
}

export async function fetchVideoBlob(id: string) {
  const response = await api.get<Blob>(`/messages/${id}`, {
    responseType: "blob",
  });

  return response.data;
}

export function getApiErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as
      | { error?: string; message?: string; details?: { fieldErrors?: Record<string, string[]> } }
      | undefined;

    if (payload?.error) {
      return payload.error;
    }

    if (payload?.message) {
      return payload.message;
    }

    const fieldErrors = payload?.details?.fieldErrors;
    if (fieldErrors) {
      const firstFieldError = Object.values(fieldErrors).flat()[0];
      if (firstFieldError) {
        return firstFieldError;
      }
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Une erreur inattendue est survenue.";
}
