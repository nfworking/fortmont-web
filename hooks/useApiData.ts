"use client";

import { useState, useEffect, useCallback } from "react";

export interface UseApiDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastFetched: Date | null;
  refresh: () => void;
}

export function useApiData<T>(
  endpoint: string,
  params: Record<string, string | number> = {}
): UseApiDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  // Convert parameters safely to strings for URLSearchParams
  const stringParams: Record<string, string> = Object.fromEntries(
    Object.entries(params).map(([key, val]) => [key, String(val)])
  );
  
  const query = new URLSearchParams(stringParams).toString();
  const url = `${endpoint}${query ? `?${query}` : ""}`;

  const doFetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      
      const json = await res.json();
      // Unwraps Microsoft Graph style objects automatically if `.value` exists
      setData(json?.value ?? json);
      setLastFetched(new Date());
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    doFetch();
  }, [doFetch]);

  return { data, loading, error, lastFetched, refresh: doFetch };
}