"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type { TranscriptTurn } from "@/lib/realtime";
import { SubtitleBubble } from "./SubtitleBubble";

interface SubtitleListProps {
  turns: TranscriptTurn[];
  emptyHint?: ReactNode;
}

export function SubtitleList({
  turns,
  emptyHint = "Press Connect and say something in English to start.",
}: SubtitleListProps) {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [turns]);

  if (turns.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
        {emptyHint}
      </div>
    );
  }

  return (
    <ol className="flex flex-col gap-3 px-4 py-4">
      {turns.map((turn) => (
        <li key={turn.id}>
          <SubtitleBubble turn={turn} />
        </li>
      ))}
      <div ref={endRef} aria-hidden />
    </ol>
  );
}
