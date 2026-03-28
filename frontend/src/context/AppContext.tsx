"use client";

import { createContext, useContext, useState } from "react";
import type { Source } from "@/types";

interface AppState {
  connectedSources: Source[];
  addConnectedSources: (sources: Source[]) => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [connectedSources, setConnectedSources] = useState<Source[]>([]);

  function addConnectedSources(sources: Source[]) {
    setConnectedSources((prev) => {
      const next = new Set<Source>([...prev, ...sources]);
      return Array.from(next);
    });
  }

  return (
    <AppContext.Provider value={{ connectedSources, addConnectedSources }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
}
