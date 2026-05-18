import { describe, it, expect, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useEphemeralToken } from "./useEphemeralToken";

describe("useEphemeralToken", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("resolves token, isPending toggles true → false, error null", async () => {
    let resolveFetch!: (res: Response) => void;
    const pending = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });
    vi.stubGlobal("fetch", vi.fn(() => pending));

    const { result } = renderHook(() => useEphemeralToken());
    expect(result.current.isPending).toBe(false);

    let tokenPromise!: Promise<string>;
    act(() => {
      tokenPromise = result.current.fetch();
    });

    expect(result.current.isPending).toBe(true);

    await act(async () => {
      resolveFetch(
        new Response(JSON.stringify({ value: "tok-123", expiresAt: 0 }), {
          status: 200,
        }),
      );
      await tokenPromise;
    });

    await expect(tokenPromise).resolves.toBe("tok-123");
    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("rejects with status text on non-ok response and sets error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response("", { status: 500, statusText: "Server Error" }),
      ),
    );

    const { result } = renderHook(() => useEphemeralToken());

    await act(async () => {
      await expect(result.current.fetch()).rejects.toThrow(
        /\/api\/session failed: 500/,
      );
    });

    expect(result.current.error?.message).toMatch(/\/api\/session failed: 500/);
    expect(result.current.isPending).toBe(false);
  });

  it("rejects when response body missing 'value' and sets error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ expiresAt: 1 }), { status: 200 }),
      ),
    );

    const { result } = renderHook(() => useEphemeralToken());

    await act(async () => {
      await expect(result.current.fetch()).rejects.toThrow(/missing 'value'/);
    });

    expect(result.current.error?.message).toMatch(/missing 'value'/);
    expect(result.current.isPending).toBe(false);
  });
});
