import type { ActionRequired, DevBoardMR } from "~/types";

export interface NotificationAction {
  mr: DevBoardMR;
  action: ActionRequired;
}

const actionItems = ref<NotificationAction[]>([]);

export function useNotifications() {
  const { mrs, status, todos, pendingCount: todoCount } = useProvider();

  // Map todo actions to their MR action equivalents
  const todoActionToMrAction: Record<string, ActionRequired[]> = {
    review_requested: ["review"],
    approval_required: ["review"],
    build_failed: ["fix-pipeline"],
    unmergeable: ["rebase"],
  };

  watchEffect(() => {
    const username = status.value?.username;
    if (!username) {
      actionItems.value = [];
      return;
    }

    actionItems.value = mrs.value
      .map((mr) => ({
        mr,
        action: getActionRequired(mr, username),
      }))
      .filter(({ action }) => action !== "waiting")
      .filter(({ mr, action }) => {
        // Skip if a todo already covers this action for this MR
        return !todos.value.some((todo) => {
          if (todo.targetType !== "MergeRequest") return false;
          if (todo.target.iid !== mr.iid || todo.projectPath !== mr.projectPath)
            return false;

          const coveredActions = todoActionToMrAction[todo.action];
          return coveredActions?.includes(action) ?? false;
        });
      });
  });

  const actionCount = computed(() => actionItems.value.length);
  const totalCount = computed(() => todoCount.value + actionCount.value);

  return {
    actionItems,
    actionCount,
    totalCount,
  };
}
