"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getActionPlan, confirmAction, executeAction } from "@/apis/agent";
import { MOCK_EXECUTION_SUCCESS_MS } from "@/lib/action-execution-mock";
import { planKey, actionKey, savingsSummaryKey } from "./keys";
import type { ActionPlan } from "@/types";

export const usePlan = (userGoal?: string) => {
  const query = useQuery<ActionPlan>({
    queryKey: planKey(userGoal),
    queryFn: () => getActionPlan(userGoal),
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  return {
    ...query,
    plan: query.data,
  };
};

export const useConfirmAction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recommendationId, approvedBy }: { recommendationId: string; approvedBy?: string }) =>
      confirmAction(recommendationId, approvedBy),
    onSuccess: async ({ action_id }) => {
      // pre-populate the action cache so /actions/[id] loads immediately
      await queryClient.invalidateQueries({ queryKey: actionKey(action_id) });
    },
  });
};

export const useExecuteAction = (actionId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => executeAction(actionId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: actionKey(actionId) });
      // Mock run completes asynchronously; refetch when overlay flips to succeeded.
      window.setTimeout(() => {
        void queryClient.invalidateQueries({ queryKey: actionKey(actionId) });
        void queryClient.invalidateQueries({ queryKey: savingsSummaryKey() });
      }, MOCK_EXECUTION_SUCCESS_MS + 150);
    },
  });
};
