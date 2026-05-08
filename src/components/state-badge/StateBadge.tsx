import { cn } from "@/lib/utils";
import type { SessionState } from "@/lib/realtime";

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

interface StateBadgeProps {
  state: SessionState;
  className?: string;
}

export function StateBadge({ state, className }: StateBadgeProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-pill border border-border bg-card px-3 py-1 text-xs",
        className,
      )}
      aria-live="polite"
    >
      <span
        className={cn("size-2 rounded-pill", STATE_DOT[state])}
        aria-hidden
      />
      <span className="font-mono">{STATE_LABEL[state]}</span>
    </div>
  );
}
