"use client";

import { useQuery } from "@tanstack/react-query";
import { getAction, getSavingsSummary } from "@/apis/actions";
import { actionKey, savingsSummaryKey } from "./keys";
import type { ActionDetail, SavingsSummary } from "@/types";

export const useAction = (actionId: string) => {
  const query = useQuery<ActionDetail>({
    queryKey: actionKey(actionId),
    queryFn: () => getAction(actionId),
    // poll every 3s while executing
    refetchInterval: (query) =>
      query.state.data?.status === "executing" ? 3000 : false,
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
