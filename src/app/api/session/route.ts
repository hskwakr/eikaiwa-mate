import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REALTIME_MODEL = "gpt-realtime-mini";
const REALTIME_VOICE = "coral";
const SECRET_TTL_SECONDS = 60;

export async function POST() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured" },
      { status: 500 }
    );
  }

  const client = new OpenAI({ apiKey });

  try {
    const clientSecret = await client.realtime.clientSecrets.create({
      expires_after: {
        anchor: "created_at",
        seconds: SECRET_TTL_SECONDS,
      },
      session: {
        type: "realtime",
        model: REALTIME_MODEL,
        audio: {
          output: {
            voice: REALTIME_VOICE,
          },
        },
      },
    });

    return NextResponse.json(clientSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/session] failed to create client secret:", message);
    return NextResponse.json(
      { error: "Failed to create realtime client secret" },
      { status: 502 }
    );
  }
}
