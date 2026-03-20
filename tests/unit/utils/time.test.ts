import { describe, expect, it } from "vitest";
import { timeAgo } from "~/utils/time";

const NOW = new Date("2026-03-20T12:00:00Z").getTime();

function ago(ms: number): string {
  return new Date(NOW - ms).toISOString();
}

const SECOND = 1_000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe("timeAgo", () => {
  it('returns "just now" for less than 60 seconds', () => {
    expect(timeAgo(ago(0), NOW)).toBe("just now");
    expect(timeAgo(ago(30 * SECOND), NOW)).toBe("just now");
    expect(timeAgo(ago(59 * SECOND), NOW)).toBe("just now");
  });

  it("returns minutes", () => {
    expect(timeAgo(ago(1 * MINUTE), NOW)).toBe("1m ago");
    expect(timeAgo(ago(30 * MINUTE), NOW)).toBe("30m ago");
    expect(timeAgo(ago(59 * MINUTE), NOW)).toBe("59m ago");
  });

  it("returns hours", () => {
    expect(timeAgo(ago(1 * HOUR), NOW)).toBe("1h ago");
    expect(timeAgo(ago(12 * HOUR), NOW)).toBe("12h ago");
    expect(timeAgo(ago(23 * HOUR), NOW)).toBe("23h ago");
  });

  it("returns days", () => {
    expect(timeAgo(ago(1 * DAY), NOW)).toBe("1d ago");
    expect(timeAgo(ago(15 * DAY), NOW)).toBe("15d ago");
    expect(timeAgo(ago(29 * DAY), NOW)).toBe("29d ago");
  });

  it("returns months", () => {
    expect(timeAgo(ago(30 * DAY), NOW)).toBe("1mo ago");
    expect(timeAgo(ago(60 * DAY), NOW)).toBe("2mo ago");
    expect(timeAgo(ago(11 * 30 * DAY), NOW)).toBe("11mo ago");
  });

  it("returns years", () => {
    expect(timeAgo(ago(365 * DAY), NOW)).toBe("1y ago");
    expect(timeAgo(ago(730 * DAY), NOW)).toBe("2y ago");
  });

  it("uses Date.now() when no `now` parameter is provided", () => {
    const recent = new Date(Date.now() - 10 * SECOND).toISOString();
    expect(timeAgo(recent)).toBe("just now");
  });
});
