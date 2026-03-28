"use client";

import { createContext, useContext, useState } from "react";
import type { Source } from "@/types";

interface AppState {
  connectedSource: Source | null;
  setConnectedSource: (source: Source) => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [connectedSource, setConnectedSource] = useState<Source | null>(null);

  return (
    <AppContext.Provider value={{ connectedSource, setConnectedSource }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
}
