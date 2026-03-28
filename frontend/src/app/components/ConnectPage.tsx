"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { CreditCard, Mail, MessageSquare, FileSpreadsheet, ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { connectSource } from "@/apis/connect";
import type { Source } from "@/types";

const connectors: { source: Source; icon: ReactNode; title: string; description: string }[] = [
  {
    source: "bank",
    icon: <CreditCard className="w-5 h-5 text-gray-600" />,
    title: "Bank / Cards",
    description: "Connect via Plaid to detect recurring charges",
  },
  {
    source: "gmail",
    icon: <Mail className="w-5 h-5 text-violet-600" />,
    title: "Gmail",
    description: "Scan receipts and subscription emails",
  },
  {
    source: "slack",
    icon: <MessageSquare className="w-5 h-5 text-gray-600" />,
    title: "Slack",
    description: "Analyze app integrations and usage patterns",
  },
  {
    source: "csv",
    icon: <FileSpreadsheet className="w-5 h-5 text-gray-600" />,
    title: "CSV Upload",
    description: "Import your own expense data",
  },
];

export default function ConnectPage() {
  const router = useRouter();
  const [hoveredSource, setHoveredSource] = useState<Source | null>(null);
  const [activeSource, setActiveSource] = useState<Source | null>(null);

  const { mutate: connect, error } = useMutation({
    mutationFn: (source: Source) => connectSource(source),
    onSuccess: () => router.push("/dashboard"),
  });

  function handleConnect(source: Source) {
    setActiveSource(source);
    connect(source);
  }

  return (
    <div className="flex flex-col items-center justify-center flex-1 bg-gray-50 px-4 py-16">
      <h1 className="text-4xl font-bold text-gray-900 mb-3">Connect your data</h1>
      <p className="text-gray-500 mb-4 text-base">
        Link a data source to start detecting wasted SaaS spend
      </p>
      {error && (
        <p className="text-sm text-red-600 mb-6" role="alert">
          Something went wrong while connecting. Please try again.
        </p>
      )}

      <div className="w-full max-w-xl flex flex-col gap-3">
        {connectors.map(({ source, icon, title, description }) => {
          const isHovered = hoveredSource === source;
          const isLoading = activeSource === source;
          return (
            <button
              key={source}
              onClick={() => handleConnect(source)}
              onMouseEnter={() => setHoveredSource(source)}
              onMouseLeave={() => setHoveredSource(null)}
              disabled={!!activeSource}
              className={`flex items-center gap-4 w-full px-5 py-4 rounded-lg border bg-white text-left transition-all
                ${isHovered ? "border-violet-400 bg-gray-50 shadow-sm" : "border-gray-200"}
                ${isLoading ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <div className={`flex items-center justify-center w-10 h-10 rounded-md border
                ${isHovered ? "border-violet-200 bg-violet-50" : "border-gray-200 bg-gray-50"}`}>
                {icon}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 text-sm">{title}</div>
                <div className="text-gray-500 text-sm">{description}</div>
              </div>
              {isHovered && !isLoading && (
                <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
              )}
              {isLoading && (
                <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-4 w-full max-w-xl my-6">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-sm text-gray-400">or</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <div className="w-full max-w-xl flex flex-col items-center gap-2">
        <Button
          variant="outline"
          className="w-full border-violet-400 text-violet-600 hover:bg-violet-50 hover:text-violet-700 gap-2 h-11"
          onClick={() => handleConnect("demo")}
          disabled={!!activeSource}
        >
          {activeSource === "demo" ? (
            <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          Try demo mode
        </Button>
        <p className="text-xs text-gray-400 text-center">
          Demo mode loads sample data so you can explore without connecting real accounts
        </p>
      </div>
    </div>
  );
}
