import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE = "/api";

export interface EmployerProfile {
  id: number;
  email: string;
  companyName: string;
  contactName: string;
  phone?: string | null;
  logoUrl?: string | null;
}

interface EmployerAuthState {
  token: string | null;
  employer: EmployerProfile | null;
  isLoading: boolean;
}

interface EmployerAuthContextType extends EmployerAuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  companyName: string;
  contactName: string;
  phone?: string;
}

const EmployerAuthContext = createContext<EmployerAuthContextType | null>(null);

export function EmployerAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<EmployerAuthState>({
    token: null,
    employer: null,
    isLoading: true,
  });

  useEffect(() => {
    AsyncStorage.multiGet(["employer_token", "employer_profile"]).then(([tokenEntry, profileEntry]) => {
      const token = tokenEntry[1];
      const profile = profileEntry[1] ? JSON.parse(profileEntry[1]) : null;
      setState({ token, employer: profile, isLoading: false });
    });
  }, []);

  async function apiFetch(path: string, options?: RequestInit) {
    const domain = typeof window !== "undefined" ? window.location.origin : "";
    const res = await fetch(`${domain}${API_BASE}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
  }

  async function login(email: string, password: string) {
    const data = await apiFetch("/auth/employer/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    await AsyncStorage.multiSet([
      ["employer_token", data.token],
      ["employer_profile", JSON.stringify(data.employer)],
    ]);
    setState({ token: data.token, employer: data.employer, isLoading: false });
  }

  async function register(registerData: RegisterData) {
    const data = await apiFetch("/auth/employer/register", {
      method: "POST",
      body: JSON.stringify(registerData),
    });
    await AsyncStorage.multiSet([
      ["employer_token", data.token],
      ["employer_profile", JSON.stringify(data.employer)],
    ]);
    setState({ token: data.token, employer: data.employer, isLoading: false });
  }

  async function logout() {
    await AsyncStorage.multiRemove(["employer_token", "employer_profile"]);
    setState({ token: null, employer: null, isLoading: false });
  }

  return (
    <EmployerAuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </EmployerAuthContext.Provider>
  );
}

export function useEmployerAuth() {
  const ctx = useContext(EmployerAuthContext);
  if (!ctx) throw new Error("useEmployerAuth must be used within EmployerAuthProvider");
  return ctx;
}

export async function employerApiFetch(path: string, token: string, options?: RequestInit) {
  const domain = typeof window !== "undefined" ? window.location.origin : "";
  const res = await fetch(`${domain}${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options?.headers ?? {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}
