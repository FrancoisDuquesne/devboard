import { describe, expect, it } from "vitest";
import {
  abbreviate,
  computeProjectAliases,
  getProjectInitials,
} from "~/utils/projectAlias";

describe("abbreviate", () => {
  it("takes initials of hyphen-separated words", () => {
    expect(abbreviate("mission-control-center")).toBe("MCC");
    expect(abbreviate("magic-baby")).toBe("MB");
  });

  it("takes initials of underscore-separated words", () => {
    expect(abbreviate("my_project_name")).toBe("MPN");
  });

  it("takes first 3 chars for single words", () => {
    expect(abbreviate("sigint")).toBe("SIG");
    expect(abbreviate("api")).toBe("API");
  });

  it("uppercases the result", () => {
    expect(abbreviate("ab")).toBe("AB");
  });
});

describe("getProjectInitials", () => {
  it("returns initials from the last path segment", () => {
    expect(getProjectInitials("group/mission-control-center")).toBe("MCC");
    expect(getProjectInitials("org/sub/my-app")).toBe("MA");
  });

  it("handles single segment paths", () => {
    expect(getProjectInitials("devboard")).toBe("DEV");
  });

  it("returns empty string for undefined / empty", () => {
    expect(getProjectInitials(undefined)).toBe("");
    expect(getProjectInitials("")).toBe("");
  });
});

describe("computeProjectAliases", () => {
  it("maps each path to its alias", () => {
    const result = computeProjectAliases([
      "group/mission-control-center",
      "group/magic-baby",
    ]);
    expect(result.get("group/mission-control-center")).toBe("MCC");
    expect(result.get("group/magic-baby")).toBe("MB");
  });

  it("resolves collisions by prepending parent initials", () => {
    const result = computeProjectAliases(["alpha/my-app", "beta/my-app"]);
    expect(result.get("alpha/my-app")).toBe("ALP/MA");
    expect(result.get("beta/my-app")).toBe("BET/MA");
  });

  it("handles empty input", () => {
    const result = computeProjectAliases([]);
    expect(result.size).toBe(0);
  });
});
