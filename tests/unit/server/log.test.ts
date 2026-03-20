import { describe, expect, it } from "vitest";
import { errorMessage } from "~~/server/utils/log";

describe("errorMessage", () => {
  it("extracts message from Error instances", () => {
    expect(errorMessage(new Error("something broke"))).toBe("something broke");
  });

  it("returns string errors as-is", () => {
    expect(errorMessage("raw error")).toBe("raw error");
  });

  it('returns "Unknown error" for other types', () => {
    expect(errorMessage(42)).toBe("Unknown error");
    expect(errorMessage(null)).toBe("Unknown error");
    expect(errorMessage(undefined)).toBe("Unknown error");
    expect(errorMessage({ code: 500 })).toBe("Unknown error");
  });
});
