import { useLocalStorage } from "@vueuse/core";
import type {
  GraphGroupBy,
  GraphNodeType,
  MrRole,
  MrSortDirection,
  MrSortField,
  PipelineStatus,
} from "~/types";

const roleFilter = useLocalStorage<MrRole>("devboard:role-filter", "all");
const projectFilter = useLocalStorage<string | null>("devboard:project-filter", null);
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

export function usePreferences() {
  function resetAllFilters() {
    roleFilter.value = "all";
    projectFilter.value = null;
    pipelineFilter.value = "all";
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
    resetAllFilters,
  };
}
