"use client"; 

import { useQuery } from "@tanstack/react-query";
import { fetchAccount, type AccountResponse } from "@/lib/storage";

export function useAccount() {
  return useQuery<AccountResponse>({
    queryKey: ["account"],
    queryFn: fetchAccount,
    retry: false,
    staleTime: 30_000, // 30 seconds
  });
}