"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createRealtimeAdapter,
  type RealtimeError,
  type RealtimeSession,
  type SessionState,
  type TranscriptTurn,
} from "@/lib/realtime";
import { SubtitleList } from "@/components/subtitles/SubtitleList";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

const STATE_DOT: Record<SessionState, string> = {
  idle: "bg-muted-foreground/40",
  connecting: "bg-accent animate-pulse",
  listening: "bg-you",
  speaking: "bg-mate",
  error: "bg-destructive",
};

export default function Home() {
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
  const connectDisabled = busy || connected || state === "connecting";
  const disconnectDisabled =
    busy || (!connected && state !== "connecting" && state !== "error");

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <h1 className="text-base font-semibold tracking-tight">
          Eikaiwa Mate
        </h1>
        <div
          className="flex items-center gap-2 rounded-pill border border-border bg-card px-3 py-1 text-xs"
          aria-live="polite"
        >
          <span
            className={cn("size-2 rounded-pill", STATE_DOT[state])}
            aria-hidden
          />
          <span className="font-mono">{STATE_LABEL[state]}</span>
        </div>
      </header>

      <main className="flex flex-1 flex-col overflow-y-auto">
        {error ? (
          <div
            role="alert"
            className="mx-4 mt-4 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm"
          >
            <div className="font-mono text-xs uppercase tracking-wide text-destructive">
              {error.code}
            </div>
            <div className="mt-1 text-foreground">{error.message}</div>
          </div>
        ) : null}
        <div className="flex flex-1 flex-col">
          <SubtitleList turns={turns} />
        </div>
      </main>

      <footer className="sticky bottom-0 border-t border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleToggleMic}
            disabled={!connected}
            aria-pressed={!micEnabled}
            className="h-12 flex-1 text-base"
          >
            {micEnabled ? "Mute" : "Unmute"}
          </Button>
          {connected || state === "connecting" ? (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDisconnect}
              disabled={disconnectDisabled}
              className="h-12 flex-1 text-base"
            >
              Disconnect
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleConnect}
              disabled={connectDisabled}
              className="h-12 flex-1 text-base"
            >
              {busy ? "Connecting…" : "Connect"}
            </Button>
          )}
        </div>
      </footer>

      <audio ref={audioRef} autoPlay className="hidden" />
    </div>
  );
}
