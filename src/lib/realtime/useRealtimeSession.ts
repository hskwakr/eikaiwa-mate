"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createRealtimeAdapter } from "./adapter";
import type {
  RealtimeAdapter,
  RealtimeError,
  RealtimeSession,
  SessionState,
  TranscriptTurn,
} from "./types";

interface SessionTokenResponse {
  value: string;
  expiresAt: number;
}

async function fetchEphemeralToken(): Promise<string> {
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
}

export interface UseRealtimeSessionOptions {
  adapter?: RealtimeAdapter;
}

export interface UseRealtimeSessionResult {
  state: SessionState;
  turns: TranscriptTurn[];
  error: RealtimeError | null;
  micEnabled: boolean;
  busy: boolean;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  toggleMic: () => void;
}

export function useRealtimeSession(
  options: UseRealtimeSessionOptions = {},
): UseRealtimeSessionResult {
  const { adapter: injectedAdapter } = options;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sessionRef = useRef<RealtimeSession | null>(null);
  const [state, setState] = useState<SessionState>("idle");
  const [micEnabled, setMicEnabled] = useState(true);
  const [error, setError] = useState<RealtimeError | null>(null);
  const [turns, setTurns] = useState<TranscriptTurn[]>([]);
  const [busy, setBusy] = useState(false);

  const upsertTurn = useCallback((turn: TranscriptTurn) => {
    setTurns((prev) => {
      const idx = prev.findIndex((t) => t.id === turn.id);
      if (idx === -1) return [...prev, turn];
      const next = prev.slice();
      next[idx] = turn;
      return next;
    });
  }, []);

  const connect = useCallback(async () => {
    if (sessionRef.current || busy) return;
    if (!audioRef.current) return;
    setBusy(true);
    setError(null);
    setTurns([]);
    try {
      const adapter = injectedAdapter ?? createRealtimeAdapter();
      const session = await adapter.connect({
        fetchEphemeralToken,
        audioElement: audioRef.current,
        onEvent: (event) => {
          if (event.type === "state") setState(event.state);
          else if (event.type === "transcript") upsertTurn(event.turn);
          else if (event.type === "error") setError(event.error);
        },
      });
      sessionRef.current = session;
      setMicEnabled(true);
    } catch (err) {
      sessionRef.current = null;
      setError((prev) =>
        prev ?? {
          code: "connection_failed",
          message: err instanceof Error ? err.message : "Connect failed",
        },
      );
    } finally {
      setBusy(false);
    }
  }, [busy, injectedAdapter, upsertTurn]);

  const disconnect = useCallback(async () => {
    const session = sessionRef.current;
    if (!session) return;
    setBusy(true);
    try {
      await session.disconnect();
    } finally {
      sessionRef.current = null;
      setBusy(false);
    }
  }, []);

  const toggleMic = useCallback(() => {
    const session = sessionRef.current;
    if (!session) return;
    const next = !micEnabled;
    session.setMicEnabled(next);
    setMicEnabled(next);
  }, [micEnabled]);

  useEffect(() => {
    return () => {
      sessionRef.current?.disconnect();
      sessionRef.current = null;
    };
  }, []);

  return {
    state,
    turns,
    error,
    micEnabled,
    busy,
    audioRef,
    connect,
    disconnect,
    toggleMic,
  };
}
