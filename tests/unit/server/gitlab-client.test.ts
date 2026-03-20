import { describe, expect, it } from "vitest";
import { mapWithConcurrency } from "~~/server/utils/gitlab-client";

describe("mapWithConcurrency", () => {
  it("resolves all items successfully", async () => {
    const items = [1, 2, 3];
    const results = await mapWithConcurrency(items, async (n) => n * 2);

    expect(results).toHaveLength(3);
    expect(results[0]).toEqual({ status: "fulfilled", value: 2 });
    expect(results[1]).toEqual({ status: "fulfilled", value: 4 });
    expect(results[2]).toEqual({ status: "fulfilled", value: 6 });
  });

  it("captures rejections without aborting other tasks", async () => {
    const items = [1, 2, 3];
    const results = await mapWithConcurrency(items, async (n) => {
      if (n === 2) throw new Error("fail");
      return n * 10;
    });

    expect(results[0]).toEqual({ status: "fulfilled", value: 10 });
    expect(results[1]).toMatchObject({ status: "rejected" });
    expect((results[1] as PromiseRejectedResult).reason).toBeInstanceOf(Error);
    expect(results[2]).toEqual({ status: "fulfilled", value: 30 });
  });

  it("handles empty input", async () => {
    const results = await mapWithConcurrency([], async () => 1);
    expect(results).toHaveLength(0);
  });

  it("preserves result order regardless of completion order", async () => {
    const items = [30, 10, 20];
    const results = await mapWithConcurrency(items, async (ms) => {
      await new Promise((r) => setTimeout(r, ms));
      return ms;
    });

    expect(results.map((r) => (r as PromiseFulfilledResult<number>).value)).toEqual([
      30, 10, 20,
    ]);
  });

  it("handles a single item", async () => {
    const results = await mapWithConcurrency([42], async (n) => n);
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({ status: "fulfilled", value: 42 });
  });

  it("processes more items than MAX_CONCURRENCY (10)", async () => {
    const items = Array.from({ length: 25 }, (_, i) => i);
    const results = await mapWithConcurrency(items, async (n) => n + 1);

    expect(results).toHaveLength(25);
    for (let i = 0; i < 25; i++) {
      expect(results[i]).toEqual({ status: "fulfilled", value: i + 1 });
    }
  });
});
