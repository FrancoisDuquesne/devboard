import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TtlCache } from "~~/server/utils/cache";

describe("TtlCache", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("stores and retrieves a value", () => {
    const cache = new TtlCache<string, number>();
    cache.set("a", 1);
    expect(cache.get("a")).toBe(1);
  });

  it("returns undefined for missing keys", () => {
    const cache = new TtlCache<string, number>();
    expect(cache.get("missing")).toBeUndefined();
  });

  it("expires entries after TTL", () => {
    const cache = new TtlCache<string, number>(1000);
    cache.set("a", 1);
    expect(cache.get("a")).toBe(1);

    vi.advanceTimersByTime(999);
    expect(cache.get("a")).toBe(1);

    vi.advanceTimersByTime(2);
    expect(cache.get("a")).toBeUndefined();
  });

  it("evicts oldest entry when maxSize is reached", () => {
    const cache = new TtlCache<string, number>(60000, 2);
    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("c", 3); // should evict "a"

    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("b")).toBe(2);
    expect(cache.get("c")).toBe(3);
  });

  it("overwrites existing keys", () => {
    const cache = new TtlCache<string, number>();
    cache.set("a", 1);
    cache.set("a", 2);
    expect(cache.get("a")).toBe(2);
  });
});
