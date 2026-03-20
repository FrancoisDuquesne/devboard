import { describe, expect, it } from "vitest";
import { isSafeUrl } from "~/utils/url";

describe("isSafeUrl", () => {
  it("accepts https URLs", () => {
    expect(isSafeUrl("https://example.com")).toBe(true);
    expect(isSafeUrl("https://gitlab.example.com/path")).toBe(true);
  });

  it("accepts http URLs", () => {
    expect(isSafeUrl("http://localhost:3000")).toBe(true);
  });

  it("rejects javascript: protocol", () => {
    expect(isSafeUrl("javascript:alert(1)")).toBe(false);
  });

  it("rejects data: protocol", () => {
    expect(isSafeUrl("data:text/html,<h1>Hi</h1>")).toBe(false);
  });

  it("rejects empty / null / undefined", () => {
    expect(isSafeUrl("")).toBe(false);
    expect(isSafeUrl(null)).toBe(false);
    expect(isSafeUrl(undefined)).toBe(false);
  });

  it("rejects malformed URLs", () => {
    expect(isSafeUrl("not-a-url")).toBe(false);
    expect(isSafeUrl("://missing-protocol")).toBe(false);
  });
});
