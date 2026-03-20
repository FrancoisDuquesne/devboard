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
  it("has an entry for every TodoAction", () => {
    for (const action of ALL_ACTIONS) {
      expect(todoActionConfig[action]).toBeDefined();
    }
  });

  it("every entry has label, icon, and color", () => {
    for (const action of ALL_ACTIONS) {
      const config = todoActionConfig[action];
      expect(config.label).toBeTruthy();
      expect(config.icon).toBeTruthy();
      expect(config.color).toBeTruthy();
    }
  });

  it("icons follow i-lucide-* naming", () => {
    for (const action of ALL_ACTIONS) {
      expect(todoActionConfig[action].icon).toMatch(/^i-lucide-/);
    }
  });
});
