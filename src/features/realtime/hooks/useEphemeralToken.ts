"use client";

import { useCallback, useState } from "react";

interface SessionTokenResponse {
  value: string;
  expiresAt: number;
}

export interface UseEphemeralTokenResult {
  fetch: () => Promise<string>;
  isPending: boolean;
  error: Error | null;
}

export function useEphemeralToken(): UseEphemeralTokenResult {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchToken = useCallback(async (): Promise<string> => {
    setIsPending(true);
    setError(null);
    try {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        throw new Error(`/api/session failed: ${res.status} ${res.statusText}`);
      }
      const body = (await res.json()) as Partial<SessionTokenResponse>;
      if (typeof body.value !== "string") {
        throw new Error("/api/session response missing 'value'");
      }
      return body.value;
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      throw e;
    } finally {
      setIsPending(false);
    }
  }, []);

  return { fetch: fetchToken, isPending, error };
}
