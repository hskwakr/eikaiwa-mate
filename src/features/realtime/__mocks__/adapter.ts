import { vi, type Mock } from "vitest";
import type {
  ConnectOptions,
  RealtimeAdapter,
  RealtimeEvent,
  RealtimeSession,
  SessionState,
} from "../types";

export interface MockAdapter {
  adapter: RealtimeAdapter;
  connect: Mock<(options: ConnectOptions) => Promise<RealtimeSession>>;
  session: {
    setMicEnabled: Mock<(enabled: boolean) => void>;
    disconnect: Mock<() => Promise<void>>;
    getState: Mock<() => SessionState>;
  };
  emit: (event: RealtimeEvent) => void;
  getConnectOptions: () => ConnectOptions | null;
  setNextConnectError: (error: unknown) => void;
}

export function createMockAdapter(): MockAdapter {
  let lastOptions: ConnectOptions | null = null;
  let nextError: unknown = null;

  const setMicEnabled = vi.fn<(enabled: boolean) => void>();
  const disconnect = vi.fn<() => Promise<void>>(async () => {});
  const getState = vi.fn<() => SessionState>(() => "idle");

  const session: RealtimeSession = {
    setMicEnabled,
    disconnect,
    getState,
  };

  const connect = vi.fn<(options: ConnectOptions) => Promise<RealtimeSession>>(
    async (options) => {
      lastOptions = options;
      if (nextError !== null) {
        const err = nextError;
        nextError = null;
        throw err;
      }
      return session;
    },
  );

  const adapter: RealtimeAdapter = { connect };

  return {
    adapter,
    connect,
    session: { setMicEnabled, disconnect, getState },
    emit: (event) => {
      if (!lastOptions) {
        throw new Error("emit called before connect");
      }
      lastOptions.onEvent(event);
    },
    getConnectOptions: () => lastOptions,
    setNextConnectError: (error) => {
      nextError = error;
    },
  };
}
