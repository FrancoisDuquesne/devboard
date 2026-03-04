import type { TodoAction } from "~/types";

interface TodoActionConfig {
  label: string;
  icon: string;
  color: string;
}

export const todoActionConfig: Record<TodoAction, TodoActionConfig> = {
  mentioned: {
    label: "mentioned you in",
    icon: "i-lucide-at-sign",
    color: "info",
  },
  directly_addressed: {
    label: "addressed you in",
    icon: "i-lucide-at-sign",
    color: "info",
  },
  assigned: {
    label: "assigned you to",
    icon: "i-lucide-user-check",
    color: "primary",
  },
  approval_required: {
    label: "requested approval on",
    icon: "i-lucide-stamp",
    color: "warning",
  },
  build_failed: {
    label: "build failed for",
    icon: "i-lucide-x-circle",
    color: "error",
  },
  marked: {
    label: "marked a todo on",
    icon: "i-lucide-bookmark",
    color: "neutral",
  },
  unmergeable: {
    label: "unmergeable",
    icon: "i-lucide-git-pull-request",
    color: "error",
  },
  review_requested: {
    label: "requested your review on",
    icon: "i-lucide-eye",
    color: "warning",
  },
};
