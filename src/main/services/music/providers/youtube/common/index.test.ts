import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { confirmLoggedOut } from "./index";

const INTERVAL = 1500;

const options = (
  overrides: Partial<Parameters<typeof confirmLoggedOut>[1]> = {},
) => ({
  attempts: 3,
  intervalMs: INTERVAL,
  isStale: () => false,
  ...overrides,
});

describe("confirmLoggedOut", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns logged-in on the first attempt without waiting", async () => {
    const check = vi.fn().mockResolvedValue(true);

    const result = await confirmLoggedOut(check, options());

    expect(result).toBe("logged-in");
    expect(check).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("returns logged-in after two intervals when the third check passes", async () => {
    const check = vi
      .fn()
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);
    const done = vi.fn();

    confirmLoggedOut(check, options()).then(done);

    await vi.advanceTimersByTimeAsync(0);
    expect(check).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(INTERVAL - 1);
    expect(check).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(check).toHaveBeenCalledTimes(2);
    expect(done).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(INTERVAL);
    expect(check).toHaveBeenCalledTimes(3);
    expect(done).toHaveBeenCalledWith("logged-in");
  });

  it("returns logged-out once every attempt failed, without a trailing wait", async () => {
    const check = vi.fn().mockResolvedValue(false);
    const done = vi.fn();

    confirmLoggedOut(check, options()).then(done);

    await vi.advanceTimersByTimeAsync(INTERVAL * 2);

    expect(check).toHaveBeenCalledTimes(3);
    expect(done).toHaveBeenCalledWith("logged-out");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("counts a rejected check as a failed attempt", async () => {
    const check = vi
      .fn()
      .mockRejectedValueOnce(new Error("navigating"))
      .mockResolvedValueOnce(true);
    const done = vi.fn();

    confirmLoggedOut(check, options({ attempts: 2 })).then(done);

    await vi.advanceTimersByTimeAsync(INTERVAL);

    expect(check).toHaveBeenCalledTimes(2);
    expect(done).toHaveBeenCalledWith("logged-in");
  });

  it("does not throw when every check rejects", async () => {
    const check = vi.fn().mockRejectedValue(new Error("boom"));
    const done = vi.fn();

    confirmLoggedOut(check, options({ attempts: 2 })).then(done);

    await vi.advanceTimersByTimeAsync(INTERVAL);

    expect(done).toHaveBeenCalledWith("logged-out");
  });

  it("returns stale and stops checking once isStale turns true", async () => {
    let stale = false;
    const check = vi.fn().mockResolvedValue(false);
    const done = vi.fn();

    confirmLoggedOut(check, options({ isStale: () => stale })).then(done);

    await vi.advanceTimersByTimeAsync(0);
    expect(check).toHaveBeenCalledTimes(1);

    stale = true;
    await vi.advanceTimersByTimeAsync(INTERVAL * 5);

    expect(check).toHaveBeenCalledTimes(1);
    expect(done).toHaveBeenCalledWith("stale");
  });
});
