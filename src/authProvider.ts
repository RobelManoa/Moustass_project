import type { AuthProvider } from "react-admin";

const API_URL =
  process.env.REACT_APP_API_URL?.replace(/\/+$/, "") ?? "http://localhost:3001";
const STORAGE_KEY = "moustass.admin.auth";

type StoredAuth = {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: "USER" | "ADMIN";
  };
};

function saveAuth(payload: StoredAuth) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function getStoredAuth(): StoredAuth | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoredAuth;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function clearAuth() {
  localStorage.removeItem(STORAGE_KEY);
}

async function parseJson(response: Response) {
  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

export const authProvider: AuthProvider = {
  login: async ({ username, password }) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: username,
        password,
      }),
    });

    const data = await parseJson(response);

    if (!response.ok) {
      throw new Error(data?.message ?? "Connexion impossible");
    }

    if (!data?.token || !data?.user) {
      throw new Error("Réponse d'authentification invalide");
    }

    if (data.user.role !== "ADMIN") {
      clearAuth();
      throw new Error("Accès réservé aux administrateurs");
    }

    saveAuth({
      token: data.token,
      user: data.user,
    });
  },

  logout: async () => {
    clearAuth();
  },

  checkAuth: async () => {
    const stored = getStoredAuth();

    if (!stored?.token) {
      throw new Error("Authentification requise");
    }
  },

  checkError: async (error) => {
    const status = error?.status ?? error?.response?.status;

    if (status === 401 || status === 403) {
      clearAuth();
      throw error;
    }
  },

  getPermissions: async () => {
    return getStoredAuth()?.user.role ?? null;
  },

  getIdentity: async () => {
    const stored = getStoredAuth();

    if (!stored?.user) {
      throw new Error("Identité introuvable");
    }

    return {
      id: stored.user.id,
      fullName: stored.user.name || stored.user.email,
      avatar: undefined,
    };
  },
};
