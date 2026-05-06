import type {
  ConnectOptions,
  RealtimeAdapter,
  RealtimeError,
  RealtimeErrorCode,
  RealtimeEvent,
  RealtimeSession,
  SessionState,
  TranscriptTurn,
} from "./types";

const REALTIME_CALLS_URL = "https://api.openai.com/v1/realtime/calls";
const DATA_CHANNEL_LABEL = "oai-events";

interface ServerEvent {
  type: string;
  [key: string]: unknown;
}

function makeError(
  code: RealtimeErrorCode,
  message: string,
  cause?: unknown,
): RealtimeError {
  return { code, message, cause };
}

export function createOpenAIRealtimeAdapter(): RealtimeAdapter {
  return { connect };
}

async function connect(options: ConnectOptions): Promise<RealtimeSession> {
  const { fetchEphemeralToken, audioElement, onEvent, signal } = options;

  let state: SessionState = "idle";
  let pc: RTCPeerConnection | null = null;
  let dc: RTCDataChannel | null = null;
  let localStream: MediaStream | null = null;
  let disconnected = false;

  const userTurns = new Map<string, TranscriptTurn>();
  const assistantTurns = new Map<string, TranscriptTurn>();

  function setState(next: SessionState): void {
    if (state === next) return;
    state = next;
    emit({ type: "state", state: next });
  }

  function emit(event: RealtimeEvent): void {
    try {
      onEvent(event);
    } catch {
      // listener errors must not break the session loop
    }
  }

  function emitError(error: RealtimeError): void {
    setState("error");
    emit({ type: "error", error });
  }

  function getOrCreateTurn(
    map: Map<string, TranscriptTurn>,
    id: string,
    role: TranscriptTurn["role"],
  ): TranscriptTurn {
    const existing = map.get(id);
    if (existing) return existing;
    const turn: TranscriptTurn = {
      id,
      role,
      text: "",
      isFinal: false,
      startedAt: Date.now(),
    };
    map.set(id, turn);
    return turn;
  }

  function publishTurn(turn: TranscriptTurn): void {
    emit({ type: "transcript", turn: { ...turn } });
  }

  function handleServerEvent(raw: string): void {
    let event: ServerEvent;
    try {
      event = JSON.parse(raw) as ServerEvent;
    } catch {
      return;
    }

    switch (event.type) {
      case "conversation.item.input_audio_transcription.delta": {
        const itemId = event.item_id as string | undefined;
        const delta = event.delta as string | undefined;
        if (!itemId || typeof delta !== "string") return;
        const turn = getOrCreateTurn(userTurns, itemId, "user");
        turn.text += delta;
        publishTurn(turn);
        return;
      }
      case "conversation.item.input_audio_transcription.completed": {
        const itemId = event.item_id as string | undefined;
        const transcript = event.transcript as string | undefined;
        if (!itemId) return;
        const turn = getOrCreateTurn(userTurns, itemId, "user");
        if (typeof transcript === "string") turn.text = transcript;
        turn.isFinal = true;
        publishTurn(turn);
        return;
      }
      case "response.output_audio_transcript.delta": {
        const itemId = event.item_id as string | undefined;
        const delta = event.delta as string | undefined;
        if (!itemId || typeof delta !== "string") return;
        const turn = getOrCreateTurn(assistantTurns, itemId, "assistant");
        turn.text += delta;
        publishTurn(turn);
        return;
      }
      case "response.output_audio_transcript.done": {
        const itemId = event.item_id as string | undefined;
        const transcript = event.transcript as string | undefined;
        if (!itemId) return;
        const turn = getOrCreateTurn(assistantTurns, itemId, "assistant");
        if (typeof transcript === "string") turn.text = transcript;
        turn.isFinal = true;
        publishTurn(turn);
        return;
      }
      case "output_audio_buffer.started": {
        if (state !== "error") setState("speaking");
        return;
      }
      case "output_audio_buffer.stopped":
      case "output_audio_buffer.cleared": {
        if (state === "speaking") setState("listening");
        return;
      }
      case "error": {
        const message =
          (event.error as { message?: string } | undefined)?.message ??
          "Realtime API reported an error";
        emitError(makeError("unknown", message, event));
        return;
      }
      default:
        return;
    }
  }

  function cleanup(): void {
    disconnected = true;
    try {
      dc?.close();
    } catch {
      /* noop */
    }
    if (localStream) {
      for (const track of localStream.getTracks()) track.stop();
    }
    try {
      pc?.close();
    } catch {
      /* noop */
    }
    if (audioElement.srcObject) audioElement.srcObject = null;
  }

  setState("connecting");

  if (signal?.aborted) {
    emitError(makeError("connection_failed", "Aborted before connect"));
    throw new Error("Aborted");
  }

  let ephemeralKey: string;
  try {
    ephemeralKey = await fetchEphemeralToken();
  } catch (cause) {
    const message =
      cause instanceof Error
        ? cause.message
        : "Failed to fetch ephemeral token";
    emitError(makeError("token_fetch_failed", message, cause));
    throw cause instanceof Error ? cause : new Error(message);
  }

  try {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (cause) {
    const message =
      cause instanceof Error ? cause.message : "Microphone permission denied";
    emitError(makeError("mic_permission_denied", message, cause));
    throw cause instanceof Error ? cause : new Error(message);
  }

  try {
    pc = new RTCPeerConnection();

    pc.ontrack = (event) => {
      const [stream] = event.streams;
      if (stream) audioElement.srcObject = stream;
    };

    pc.onconnectionstatechange = () => {
      if (!pc) return;
      if (
        pc.connectionState === "failed" ||
        pc.connectionState === "disconnected"
      ) {
        if (!disconnected) {
          emitError(
            makeError(
              "connection_failed",
              `RTCPeerConnection ${pc.connectionState}`,
            ),
          );
        }
      }
    };

    for (const track of localStream.getAudioTracks()) {
      pc.addTrack(track, localStream);
    }

    dc = pc.createDataChannel(DATA_CHANNEL_LABEL);
    dc.addEventListener("open", () => {
      if (state === "connecting") setState("listening");
    });
    dc.addEventListener("message", (event) => {
      if (typeof event.data === "string") handleServerEvent(event.data);
    });

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const sdpResponse = await fetch(REALTIME_CALLS_URL, {
      method: "POST",
      body: offer.sdp ?? "",
      headers: {
        Authorization: `Bearer ${ephemeralKey}`,
        "Content-Type": "application/sdp",
      },
      signal,
    });

    if (!sdpResponse.ok) {
      throw new Error(
        `SDP exchange failed: ${sdpResponse.status} ${sdpResponse.statusText}`,
      );
    }

    const answerSdp = await sdpResponse.text();
    await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });
  } catch (cause) {
    const message =
      cause instanceof Error ? cause.message : "WebRTC connection failed";
    emitError(makeError("connection_failed", message, cause));
    cleanup();
    throw cause instanceof Error ? cause : new Error(message);
  }

  return {
    getState(): SessionState {
      return state;
    },
    setMicEnabled(enabled: boolean): void {
      if (!localStream) return;
      for (const track of localStream.getAudioTracks()) {
        track.enabled = enabled;
      }
    },
    async disconnect(): Promise<void> {
      if (disconnected) return;
      cleanup();
      setState("idle");
    },
  };
}
