"use client";

import { useQuery } from "@tanstack/react-query";
import { getRecurringStreams } from "@/apis/streams";
import { streamsKey } from "./keys";
import type { RecurringStreamsResponse } from "@/types";

export const useStreams = () => {
  const query = useQuery<RecurringStreamsResponse>({
    queryKey: streamsKey(),
    queryFn: getRecurringStreams,
  });

  return {
    ...query,
    streams: query.data,
  };
};
