import { NextResponse } from "next/server";
import { issueOpenAIClientSecret } from "@/features/realtime/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  const configured = process.env.APP_ORIGIN;
  if (configured) return origin === configured;
  return (
    process.env.NODE_ENV !== "production" &&
    origin === "http://localhost:3000"
  );
}

export async function POST(request: Request) {
  if (!isAllowedOrigin(request.headers.get("origin"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured" },
      { status: 500 }
    );
  }

  try {
    const secret = await issueOpenAIClientSecret(apiKey);
    return NextResponse.json(secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/session] failed to create client secret:", message);
    return NextResponse.json(
      { error: "Failed to create realtime client secret" },
      { status: 502 }
    );
  }
}
