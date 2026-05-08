"use client";

import { Button } from "@/components/ui/button";
import type { SessionState } from "@/lib/realtime";

interface SessionControlProps {
  state: SessionState;
  busy: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function SessionControl({
  state,
  busy,
  onConnect,
  onDisconnect,
}: SessionControlProps) {
  const connected = state === "listening" || state === "speaking";
  const showDisconnect = connected || state === "connecting";
  const connectDisabled = busy || connected || state === "connecting";
  const disconnectDisabled =
    busy || (!connected && state !== "connecting" && state !== "error");

  if (showDisconnect) {
    return (
      <Button
        type="button"
        variant="destructive"
        onClick={onDisconnect}
        disabled={disconnectDisabled}
        className="h-12 flex-1 text-base"
      >
        Disconnect
      </Button>
    );
  }

  return (
    <Button
      type="button"
      onClick={onConnect}
      disabled={connectDisabled}
      className="h-12 flex-1 text-base"
    >
      {busy ? "Connecting…" : "Connect"}
    </Button>
  );
}
