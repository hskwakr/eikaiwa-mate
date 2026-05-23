import OpenAI from "openai";

const REALTIME_MODEL = "gpt-realtime-mini";
const REALTIME_VOICE = "coral";
const INPUT_TRANSCRIPTION_MODEL = "gpt-4o-mini-transcribe";
const SECRET_TTL_SECONDS = 60;

const SESSION_INSTRUCTIONS = [
  "You are a casual English conversation partner.",
  "Respond ONLY in English, even if the user speaks Japanese.",
  "Keep responses short and natural (1-2 sentences).",
].join("\n");

export interface IssuedClientSecret {
  value: string;
  expiresAt: number;
}

export async function issueOpenAIClientSecret(
  apiKey: string,
): Promise<IssuedClientSecret> {
  const client = new OpenAI({ apiKey });
  const secret = await client.realtime.clientSecrets.create({
    expires_after: { anchor: "created_at", seconds: SECRET_TTL_SECONDS },
    session: {
      type: "realtime",
      model: REALTIME_MODEL,
      instructions: SESSION_INSTRUCTIONS,
      audio: {
        input: {
          transcription: { model: INPUT_TRANSCRIPTION_MODEL },
        },
        output: { voice: REALTIME_VOICE },
      },
    },
  });

  return {
    value: secret.value,
    expiresAt: secret.expires_at,
  };
}
