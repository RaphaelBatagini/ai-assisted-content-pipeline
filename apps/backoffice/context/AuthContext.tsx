"use client";

import React, {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { jwtDecode } from "jwt-decode";
import { setAccessToken } from "@/lib/api";
import api from "@/lib/api";

interface JwtPayload {
  userId: number;
  subscriptionStatus: "pending" | "active" | "cancelled";
  exp: number;
}

interface AuthUser {
  userId: number;
  subscriptionStatus: "pending" | "active" | "cancelled";
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  login: (accessToken: string) => void;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = useCallback((accessToken: string) => {
    try {
      const payload = jwtDecode<JwtPayload>(accessToken);
      setAccessToken(accessToken);
      setToken(accessToken);
      setUser({
        userId: payload.userId,
        subscriptionStatus: payload.subscriptionStatus,
      });
    } catch {
      // invalid token
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/api/auth/logout");
    } catch {
      // ignore
    }
    setAccessToken(null);
    setToken(null);
    setUser(null);
  }, []);

  // Attempt silent refresh on mount
  useEffect(() => {
    api
      .post("/api/auth/refresh")
      .then((resp) => {
        login(resp.data.accessToken);
      })
      .catch(() => {
        // no valid session — stay logged out
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [login]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
