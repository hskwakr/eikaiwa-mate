"use client";

import { useRealtimeSession, type SessionState } from "@/lib/realtime";

const STATE_LABEL: Record<SessionState, string> = {
  idle: "Idle",
  connecting: "Connecting…",
  listening: "Listening",
  speaking: "Speaking",
  error: "Error",
};

export default function RealtimeDevPage() {
  const {
    state,
    turns,
    error,
    micEnabled,
    busy,
    audioRef,
    connect,
    disconnect,
    toggleMic,
  } = useRealtimeSession();

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
          onClick={connect}
          disabled={busy || connected || state === "connecting"}
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          Connect
        </button>
        <button
          type="button"
          onClick={disconnect}
          disabled={disconnectDisabled}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium disabled:opacity-50"
        >
          Disconnect
        </button>
        <button
          type="button"
          onClick={toggleMic}
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
