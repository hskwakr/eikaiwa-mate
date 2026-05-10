"use client";

import { Button } from "@/components/ui/button";
import type { SessionState } from "@/lib/realtime";

interface SessionControlProps {
  state: SessionState;
  busy: boolean;
  connectDisabled: boolean;
  disconnectDisabled: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function SessionControl({
  state,
  busy,
  connectDisabled,
  disconnectDisabled,
  onConnect,
  onDisconnect,
}: SessionControlProps) {
  const showDisconnect =
    state === "listening" || state === "speaking" || state === "connecting";

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
