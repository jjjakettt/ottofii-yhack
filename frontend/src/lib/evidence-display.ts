import type { ActionEvidence } from "@/types";

/** Build a data URL for screenshot evidence stored as base64 + mime in payload. */
export function getScreenshotDataUrl(payload: Record<string, string>): string | null {
  const raw = payload.base64;
  if (!raw || typeof raw !== "string") return null;
  const mime = payload.mime?.trim() || "image/png";
  if (raw.startsWith("data:")) return raw;
  return `data:${mime};base64,${raw}`;
}

export function formatEvidencePrimaryLine(ev: ActionEvidence): string | null {
  if (ev.type === "confirmation_id" && ev.payload.id) return ev.payload.id;
  if (ev.type === "email" && (ev.payload.subject || ev.payload.body))
    return ev.payload.subject ?? ev.payload.body?.slice(0, 80) ?? null;
  if (ev.type === "screenshot") {
    if (getScreenshotDataUrl(ev.payload)) return "Screenshot captured";
    if (ev.payload.path) return ev.payload.path;
  }
  return null;
}
