import { useLocalStorage } from "@vueuse/core";
import type {
  GraphGroupBy,
  GraphNodeType,
  IssueScope,
  MrRole,
  MrScope,
  MrSortDirection,
  MrSortField,
  PipelineStatus,
  ProviderId,
} from "~/types";

const roleFilter = useLocalStorage<MrRole>("devboard:role-filter", "all");
const projectFilter = useLocalStorage<string[]>("devboard:project-filter", []);
const pipelineFilter = useLocalStorage<PipelineStatus | "all">(
  "devboard:pipeline-filter",
  "all",
);
const sortField = useLocalStorage<MrSortField>("devboard:sort-field", "updated");
const sortDirection = useLocalStorage<MrSortDirection>(
  "devboard:sort-direction",
  "desc",
);
const autoRefreshInterval = useLocalStorage<number>("devboard:auto-refresh", 60);
const nodeTypeFilter = useLocalStorage<GraphNodeType[]>("devboard:node-type-filter", [
  "mr",
  "issue",
  "todo",
]);
const graphGroupBy = useLocalStorage<GraphGroupBy>("devboard:graph-group-by", "none");
const hiddenWorktreePaths = useLocalStorage<string[]>(
  "devboard:hidden-worktree-paths",
  [],
);
const mrScopes = useLocalStorage<MrScope[]>("devboard:mr-scopes", [
  "authored",
  "assigned",
  "reviewer",
]);
const fetchMrsEnabled = useLocalStorage<boolean>("devboard:fetch-mrs", true);
const fetchTodosEnabled = useLocalStorage<boolean>("devboard:fetch-todos", true);
const fetchIssuesEnabled = useLocalStorage<boolean>("devboard:fetch-issues", true);
const issueScopes = useLocalStorage<IssueScope[]>("devboard:issue-scopes", [
  "assigned",
  "created",
]);
const provider = useLocalStorage<ProviderId>("devboard:provider", "gitlab");

export function usePreferences() {
  function resetAllFilters() {
    roleFilter.value = "all";
    projectFilter.value = [];
    pipelineFilter.value = "all";
  }

  function hideWorktree(path: string) {
    if (!hiddenWorktreePaths.value.includes(path)) {
      hiddenWorktreePaths.value.push(path);
    }
  }

  function unhideWorktree(path: string) {
    hiddenWorktreePaths.value = hiddenWorktreePaths.value.filter((p) => p !== path);
  }

  return {
    roleFilter,
    projectFilter,
    pipelineFilter,
    sortField,
    sortDirection,
    autoRefreshInterval,
    nodeTypeFilter,
    graphGroupBy,
    hiddenWorktreePaths,
    hideWorktree,
    unhideWorktree,
    mrScopes,
    fetchMrsEnabled,
    fetchTodosEnabled,
    fetchIssuesEnabled,
    issueScopes,
    provider,
    resetAllFilters,
  };
}
