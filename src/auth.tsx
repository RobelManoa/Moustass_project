import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AuthUser,
  ClientInfo,
  fetchClientInfo,
  fetchMe,
  getStoredToken,
  login as loginRequest,
  setAuthToken,
} from "./api/api";

type AuthContextValue = {
  clientInfo: ClientInfo | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  user: AuthUser | null;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => void;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const refreshSession = async () => {
    const [info, currentUser] = await Promise.all([fetchClientInfo(), fetchMe()]);
    setClientInfo(info);
    setUser(currentUser);
  };

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      try {
        const info = await fetchClientInfo();
        if (isMounted) {
          setClientInfo(info);
        }

        if (!getStoredToken()) {
          return;
        }

        const currentUser = await fetchMe();
        if (isMounted) {
          setUser(currentUser);
        }
      } catch {
        setAuthToken(null);
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsBootstrapping(false);
        }
      }
    }

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      clientInfo,
      isAuthenticated: Boolean(user && getStoredToken()),
      isBootstrapping,
      user,
      login: async (credentials) => {
        const result = await loginRequest(credentials);
        setUser(result.user);

        if (!clientInfo) {
          const info = await fetchClientInfo();
          setClientInfo(info);
        }
      },
      logout: () => {
        setAuthToken(null);
        setUser(null);
      },
      refreshSession: async () => {
        await refreshSession();
      },
    }),
    [clientInfo, isBootstrapping, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
