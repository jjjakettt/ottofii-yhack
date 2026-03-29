"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getActionPlan, confirmAction, executeAction, getRecommendations } from "@/apis/agent";
import { planKey, actionKey, savingsSummaryKey, recommendationsKey } from "./keys";
import type { ActionPlan, RecommendationsResponse } from "@/types";

export const useRecommendations = (status = "pending") => {
  const query = useQuery<RecommendationsResponse>({
    queryKey: recommendationsKey(status),
    queryFn: () => getRecommendations(status),
  });

  return {
    ...query,
    recommendations: query.data?.recommendations ?? [],
    totalMonthlySavings: query.data?.total_monthly_savings_usd ?? 0,
    totalAnnualSavings: query.data?.total_annual_savings_usd ?? 0,
  };
};

export const usePlan = (userGoal?: string) => {
  const query = useQuery<ActionPlan>({
    queryKey: planKey(userGoal),
    queryFn: () => getActionPlan(userGoal),
  });

  return {
    ...query,
    plan: query.data,
  };
};

export const useGeneratePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userGoal = "Reduce my monthly spend") => getActionPlan(userGoal),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: recommendationsKey("pending") });
    },
  });
};

export const useConfirmAction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recommendationId, approvedBy }: { recommendationId: string; approvedBy?: string }) =>
      confirmAction(recommendationId, approvedBy),
    onSuccess: async ({ action_id }) => {
      await queryClient.invalidateQueries({ queryKey: actionKey(action_id) });
    },
  });
};

export const useExecuteAction = (actionId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => executeAction(actionId),
    onSuccess: async () => {
      // useAction already polls every 3s while status === "executing"
      // Just invalidate once to trigger the first poll immediately
      await queryClient.invalidateQueries({ queryKey: actionKey(actionId) });
      await queryClient.invalidateQueries({ queryKey: savingsSummaryKey() });
    },
  });
};
