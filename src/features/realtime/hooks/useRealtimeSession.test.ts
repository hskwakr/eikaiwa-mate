import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRealtimeSession } from "./useRealtimeSession";
import { createMockAdapter, type MockAdapter } from "../__mocks__/adapter";

function makeAudio(): HTMLAudioElement {
  return document.createElement("audio");
}

async function connectWith(mock: MockAdapter) {
  const harness = renderHook(() =>
    useRealtimeSession({ adapter: mock.adapter }),
  );
  harness.result.current.audioRef.current = makeAudio();
  await act(async () => {
    await harness.result.current.connect();
  });
  return harness;
}

describe("useRealtimeSession", () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = createMockAdapter();
  });

  it("transitions state idle → connecting → listening → speaking → idle via adapter events", async () => {
    const { result } = await connectWith(mock);
    expect(result.current.state).toBe("idle");

    act(() => mock.emit({ type: "state", state: "connecting" }));
    expect(result.current.state).toBe("connecting");

    act(() => mock.emit({ type: "state", state: "listening" }));
    expect(result.current.state).toBe("listening");

    act(() => mock.emit({ type: "state", state: "speaking" }));
    expect(result.current.state).toBe("speaking");

    act(() => mock.emit({ type: "state", state: "idle" }));
    expect(result.current.state).toBe("idle");
  });

  it("connect happy path: micEnabled=true, turns reset, error null, adapter.connect called once", async () => {
    const { result } = await connectWith(mock);

    expect(mock.connect).toHaveBeenCalledTimes(1);
    expect(result.current.micEnabled).toBe(true);
    expect(result.current.turns).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(result.current.busy).toBe(false);
  });

  it("connect failure: error set, sessionRef cleared, busy reset, preserves adapter-emitted error (prev ?? race)", async () => {
    mock.connect.mockImplementationOnce(async (options) => {
      options.onEvent({
        type: "error",
        error: { code: "token_fetch_failed", message: "token failed" },
      });
      throw new Error("post-emit boom");
    });

    const { result } = renderHook(() =>
      useRealtimeSession({ adapter: mock.adapter }),
    );
    result.current.audioRef.current = makeAudio();

    await act(async () => {
      await result.current.connect();
    });

    expect(result.current.error).toMatchObject({
      code: "token_fetch_failed",
      message: "token failed",
    });
    expect(result.current.busy).toBe(false);

    await act(async () => {
      await result.current.disconnect();
    });
    expect(mock.session.disconnect).not.toHaveBeenCalled();
  });

  it("disconnect clears sessionRef and resets busy", async () => {
    const { result } = await connectWith(mock);

    await act(async () => {
      await result.current.disconnect();
    });

    expect(mock.session.disconnect).toHaveBeenCalledTimes(1);
    expect(result.current.busy).toBe(false);

    await act(async () => {
      await result.current.disconnect();
    });
    expect(mock.session.disconnect).toHaveBeenCalledTimes(1);
  });

  it("toggleMic flips internal state and calls session.setMicEnabled", async () => {
    const { result } = await connectWith(mock);
    expect(result.current.micEnabled).toBe(true);

    act(() => result.current.toggleMic());
    expect(result.current.micEnabled).toBe(false);
    expect(mock.session.setMicEnabled).toHaveBeenLastCalledWith(false);

    act(() => result.current.toggleMic());
    expect(result.current.micEnabled).toBe(true);
    expect(mock.session.setMicEnabled).toHaveBeenLastCalledWith(true);
  });

  it("unmount cleanup calls session.disconnect", async () => {
    const { unmount } = await connectWith(mock);

    unmount();

    expect(mock.session.disconnect).toHaveBeenCalledTimes(1);
  });
});
