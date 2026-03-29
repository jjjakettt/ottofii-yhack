export const streamsKey = () => ["streams"] as const;
export const planKey = (userGoal?: string) => ["plan", userGoal ?? "default"] as const;
export const actionKey = (actionId: string) => ["action", actionId] as const;
export const savingsSummaryKey = () => ["savings-summary"] as const;
export const recommendationsKey = (status: string) => ["recommendations", status] as const;
