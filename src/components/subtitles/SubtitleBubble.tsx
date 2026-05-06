import { cn } from "@/lib/utils";
import type { TranscriptTurn } from "@/lib/realtime";

interface SubtitleBubbleProps {
  turn: TranscriptTurn;
}

export function SubtitleBubble({ turn }: SubtitleBubbleProps) {
  const isUser = turn.role === "user";
  return (
    <div
      className={cn(
        "flex w-full",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      <div
        aria-label={isUser ? "You said" : "Mate said"}
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "rounded-br-md bg-you-soft text-foreground"
            : "rounded-bl-md bg-mate-soft text-foreground",
          !turn.isFinal && "italic opacity-70",
        )}
      >
        {turn.text ? (
          turn.text
        ) : (
          <span className="opacity-50" aria-hidden>
            …
          </span>
        )}
      </div>
    </div>
  );
}
