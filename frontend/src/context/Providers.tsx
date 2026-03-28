"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppProvider } from "./AppContext";

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>{children}</AppProvider>
    </QueryClientProvider>
  );
}
