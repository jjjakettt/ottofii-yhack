"use client";

import { useQuery } from "@tanstack/react-query";
import { getAction, getSavingsSummary } from "@/apis/actions";
import { actionKey, savingsSummaryKey } from "./keys";
import type { ActionDetail, SavingsSummary } from "@/types";

function hasPhoneRetryScheduled(evidence: ActionDetail["evidence"] | undefined): boolean {
  return evidence?.some((e) => e.type === "phone_retry_scheduled") ?? false;
}

export const useAction = (actionId: string) => {
  const query = useQuery<ActionDetail>({
    queryKey: actionKey(actionId),
    queryFn: () => getAction(actionId),
    // Poll while executing; also while failed-but-waiting for a scheduled next call.
    refetchInterval: (query) => {
      const d = query.state.data;
      if (d?.status === "executing") return 400;
      if (d?.status === "failed" && hasPhoneRetryScheduled(d.evidence)) return 5000;
      return false;
    },
    enabled: !!actionId,
  });

  return {
    ...query,
    action: query.data,
  };
};

export const useSavingsSummary = () => {
  const query = useQuery<SavingsSummary>({
    queryKey: savingsSummaryKey(),
    queryFn: getSavingsSummary,
  });

  return {
    ...query,
    summary: query.data,
  };
};
