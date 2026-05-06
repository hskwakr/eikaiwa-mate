"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createRealtimeAdapter,
  type RealtimeError,
  type RealtimeSession,
  type SessionState,
  type TranscriptTurn,
} from "@/lib/realtime";

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

const STATE_LABEL: Record<SessionState, string> = {
  idle: "Idle",
  connecting: "Connecting…",
  listening: "Listening",
  speaking: "Speaking",
  error: "Error",
};

export default function RealtimeDevPage() {
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

  const handleConnect = useCallback(async () => {
    if (sessionRef.current || busy) return;
    if (!audioRef.current) return;
    setBusy(true);
    setError(null);
    setTurns([]);
    try {
      const adapter = createRealtimeAdapter();
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
  }, [busy, upsertTurn]);

  const handleDisconnect = useCallback(async () => {
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

  const handleToggleMic = useCallback(() => {
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

  const connected = state === "listening" || state === "speaking";
  const disconnectDisabled =
    busy || (!connected && state !== "connecting" && state !== "error");

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Realtime adapter — smoke test
        </h1>
        <p className="text-sm text-muted-foreground">
          Sprint 2 [8] PoC: verify mic permission + WebRTC handshake against
          OpenAI Realtime API. This page is a temporary developer tool, not
          the product UI.
        </p>
      </header>

      <section className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          State
        </span>
        <span
          data-state={state}
          className="rounded-md bg-muted px-2 py-1 font-mono text-xs"
        >
          {STATE_LABEL[state]}
        </span>
        <span className="ml-auto font-mono text-xs text-muted-foreground">
          mic {micEnabled ? "on" : "off"}
        </span>
      </section>

      <section className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleConnect}
          disabled={busy || connected || state === "connecting"}
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          Connect
        </button>
        <button
          type="button"
          onClick={handleDisconnect}
          disabled={disconnectDisabled}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium disabled:opacity-50"
        >
          Disconnect
        </button>
        <button
          type="button"
          onClick={handleToggleMic}
          disabled={!connected}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium disabled:opacity-50"
        >
          {micEnabled ? "Mute mic" : "Unmute mic"}
        </button>
      </section>

      {error ? (
        <section className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm">
          <div className="font-mono text-xs uppercase tracking-wide text-destructive">
            {error.code}
          </div>
          <div className="mt-1 text-foreground">{error.message}</div>
        </section>
      ) : null}

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">
          Transcript ({turns.length})
        </h2>
        <ol className="flex flex-col gap-2">
          {turns.map((turn) => (
            <li
              key={turn.id}
              className="rounded-md border border-border bg-card px-3 py-2"
            >
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                <span>{turn.role}</span>
                <span className="rounded bg-muted px-1 py-0.5 font-mono">
                  {turn.isFinal ? "final" : "streaming"}
                </span>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm">
                {turn.text || <span className="opacity-50">(empty)</span>}
              </p>
            </li>
          ))}
          {turns.length === 0 ? (
            <li className="rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground">
              No transcripts yet. Connect and try saying something in English.
            </li>
          ) : null}
        </ol>
      </section>

      <audio ref={audioRef} autoPlay className="hidden" />
    </main>
  );
}
