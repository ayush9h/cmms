"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getJson, postJson } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, setState] = useState({ user: null, loading: true });

  const refresh = useCallback(async () => {
    try {
      setState({ user: await getJson("/api/auth/me"), loading: false });
    } catch {
      setState({ user: null, loading: false });
    }
  }, []);

  useEffect(() => {
    refresh();
    const signedOut = () => setState({ user: null, loading: false });
    window.addEventListener("cmms:unauthorized", signedOut);
    return () => window.removeEventListener("cmms:unauthorized", signedOut);
  }, [refresh]);

  const value = useMemo(
    () => ({
      ...state,
      isManager: state.user?.role === "manager",
      login: async (userId, password) => {
        const user = await postJson("/api/auth/login", { user_id: userId, password });
        setState({ user, loading: false });
        return user;
      },
      logout: async () => {
        await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
        setState({ user: null, loading: false, signedOut: true });
      },
    }),
    [state],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
