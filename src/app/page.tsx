"use client";

import { useRealtimeSession } from "@/lib/realtime";
import { SubtitleList } from "@/components/subtitles/SubtitleList";
import { StateBadge } from "@/components/state-badge/StateBadge";
import { SessionControl } from "@/app/_components/SessionControl";
import { Button } from "@/components/ui/button";

export default function Home() {
  const {
    state,
    turns,
    error,
    micEnabled,
    busy,
    connected,
    connectDisabled,
    disconnectDisabled,
    audioRef,
    connect,
    disconnect,
    toggleMic,
  } = useRealtimeSession();

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <h1 className="text-base font-semibold tracking-tight">
          Eikaiwa Mate
        </h1>
        <StateBadge state={state} />
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
            onClick={toggleMic}
            disabled={!connected}
            aria-pressed={!micEnabled}
            className="h-12 flex-1 text-base"
          >
            {micEnabled ? "Mute" : "Unmute"}
          </Button>
          <SessionControl
            state={state}
            busy={busy}
            connectDisabled={connectDisabled}
            disconnectDisabled={disconnectDisabled}
            onConnect={connect}
            onDisconnect={disconnect}
          />
        </div>
      </footer>

      <audio ref={audioRef} autoPlay className="hidden" />
    </div>
  );
}
