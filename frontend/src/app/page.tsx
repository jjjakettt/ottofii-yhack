"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  CreditCard,
  Mail,
  MessageSquare,
  FileSpreadsheet,
  Play,
  Loader2,
  ArrowRight,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { connectSource } from "@/apis/connect";
import type { Source } from "@/types";
import { useAppContext } from "@/context/AppContext";
import { savingsSummaryKey, streamsKey } from "@/hooks/keys";

interface SourceOption {
  id: Source;
  name: string;
  description: string;
  icon: React.ReactNode;
}

const sources: SourceOption[] = [
  {
    id: "bank",
    name: "Bank / Cards",
    description: "Connect via Plaid to detect recurring charges",
    icon: <CreditCard className="h-5 w-5" />,
  },
  {
    id: "gmail",
    name: "Gmail",
    description: "Scan receipts and subscription emails",
    icon: <Mail className="h-5 w-5" />,
  },
  {
    id: "slack",
    name: "Slack",
    description: "Analyze app integrations and usage patterns",
    icon: <MessageSquare className="h-5 w-5" />,
  },
  {
    id: "csv",
    name: "CSV Upload",
    description: "Import your own expense data",
    icon: <FileSpreadsheet className="h-5 w-5" />,
  },
];

export default function ConnectPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setConnectedSource } = useAppContext();
  const [connecting, setConnecting] = useState<Source | null>(null);

  async function handleConnect(source: Source) {
    setConnecting(source);
    try {
      await connectSource(source);
      setConnectedSource(source);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: streamsKey() }),
        queryClient.invalidateQueries({ queryKey: savingsSummaryKey() }),
      ]);
      router.push("/dashboard");
    } catch {
      setConnecting(null);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 items-center border-b border-border px-6">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <span className="text-lg font-semibold tracking-tight">Ottofii</span>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Connect your data
            </h1>
            <p className="mt-2 text-muted-foreground">
              Link a data source to start detecting wasted SaaS spend
            </p>
          </div>

          <div className="space-y-3">
            {sources.map((source) => (
              <button
                key={source.id}
                type="button"
                onClick={() => handleConnect(source.id)}
                disabled={connecting !== null}
                className="group flex w-full items-center gap-4 border border-border bg-card p-4 text-left transition-colors hover:border-primary/50 hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-border bg-background text-muted-foreground group-hover:border-primary/50 group-hover:text-primary">
                  {source.icon}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-foreground">{source.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {source.description}
                  </div>
                </div>
                <div className="text-muted-foreground">
                  {connecting === source.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="my-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-border" />
            <span className="text-sm text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button
            variant="outline"
            className="w-full gap-2 border-primary/50 text-primary hover:bg-primary/10 hover:text-primary"
            onClick={() => handleConnect("demo")}
            disabled={connecting !== null}
          >
            {connecting === "demo" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Try demo mode
          </Button>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Demo mode loads sample data so you can explore without connecting real
            accounts
          </p>
        </div>
      </main>

      <footer className="border-t border-border px-6 py-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Ottofii, Inc.</span>
          <span>SOC 2 Type II Compliant</span>
        </div>
      </footer>
    </div>
  );
}
