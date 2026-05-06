import type {
  ConnectOptions,
  RealtimeAdapter,
  RealtimeSession,
} from './types';

export function createOpenAIRealtimeAdapter(): RealtimeAdapter {
  return {
    async connect(_options: ConnectOptions): Promise<RealtimeSession> {
      // TODO(Sprint 2 [7]): fetchEphemeralToken() で OpenAI Realtime API の ephemeral key を取得
      // TODO(Sprint 2 [8]): getUserMedia でマイク取得 → RTCPeerConnection に addTrack
      // TODO(Sprint 2 [8]): SDP offer/answer を OpenAI とやりとり (Authorization: Bearer ephemeral)
      // TODO(Sprint 2 [8]): ontrack の AI 音声 stream を audioElement.srcObject に attach
      // TODO(Sprint 2 [8]): DataChannel から transcript/state を受信し RealtimeEvent に変換して onEvent へ
      throw new Error(
        'createOpenAIRealtimeAdapter: not implemented (Sprint 2 [7][8])',
      );
    },
  };
}
