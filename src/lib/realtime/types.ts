export type SessionState =
  | 'idle'
  | 'connecting'
  | 'listening'
  | 'speaking'
  | 'error';

export interface TranscriptTurn {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  isFinal: boolean;
  startedAt: number;
}

export type RealtimeErrorCode =
  | 'token_fetch_failed'
  | 'mic_permission_denied'
  | 'connection_failed'
  | 'unknown';

export interface RealtimeError {
  code: RealtimeErrorCode;
  message: string;
  cause?: unknown;
}

export type RealtimeEvent =
  | { type: 'state'; state: SessionState }
  | { type: 'transcript'; turn: TranscriptTurn }
  | { type: 'error'; error: RealtimeError };

export type RealtimeListener = (event: RealtimeEvent) => void;

export interface ConnectOptions {
  fetchEphemeralToken: () => Promise<string>;
  audioElement: HTMLAudioElement;
  onEvent: RealtimeListener;
  signal?: AbortSignal;
}

export interface RealtimeSession {
  getState(): SessionState;
  setMicEnabled(enabled: boolean): void;
  disconnect(): Promise<void>;
}

export interface RealtimeAdapter {
  connect(options: ConnectOptions): Promise<RealtimeSession>;
}
