import { describe, expect, it } from "vitest";
import type { TodoAction } from "~/types/devboard";
import { todoActionConfig } from "~/utils/todoAction";

const ALL_ACTIONS: TodoAction[] = [
  "mentioned",
  "directly_addressed",
  "assigned",
  "approval_required",
  "build_failed",
  "marked",
  "unmergeable",
  "review_requested",
];

describe("todoActionConfig", () => {
  it("covers every TodoAction (no missing keys)", () => {
    const configKeys = Object.keys(todoActionConfig);
    expect(configKeys).toHaveLength(ALL_ACTIONS.length);
    for (const action of ALL_ACTIONS) {
      expect(todoActionConfig[action]).toBeDefined();
    }
  });

  it("every entry has label, icon, and color", () => {
    for (const config of Object.values(todoActionConfig)) {
      expect(config.label).toBeTruthy();
      expect(config.icon).toBeTruthy();
      expect(config.color).toBeTruthy();
    }
  });

  it("icons follow i-lucide-* naming", () => {
    for (const config of Object.values(todoActionConfig)) {
      expect(config.icon).toMatch(/^i-lucide-/);
    }
  });
});
