import type { ComputedRef, Ref } from "vue";
import type {
  DevBoardIssue,
  DevBoardIssueDetail,
  DevBoardMR,
  DevBoardMRDetail,
  DevBoardTodo,
} from "./devboard";

export type ProviderId = "gitlab" | "github";

export interface ProviderMeta {
  id: ProviderId;
  name: string;
  mrLabel: string;
  mrLabelPlural: string;
  mrPrefix: string;
  icon: string;
  authCliCommand: string;
  authEnvVars: { host: string; token: string };
  authTokenScope: string;
  authTokenExample: string;
  authHostExample: string;
  dashboardTodosPath: (host: string) => string;
}

/**
 * Contract that every provider factory must satisfy.
 * Adding a field here forces both createGitLabProvider and
 * createGitHubProvider to implement it — compile-time parity.
 */
export interface Provider {
  // Auth
  status: Ref<{
    connected: boolean;
    host: string;
    username?: string;
    name?: string;
    avatarUrl?: string;
    error?: string;
  } | null>;
  authLoading: Ref<boolean>;
  checkConnection: (opts?: { silent?: boolean }) => Promise<void>;

  // MRs
  mrs: Ref<DevBoardMR[]>;
  mrsLoading: Ref<boolean>;
  mrsError: Ref<string | null>;
  projects: ComputedRef<string[]>;
  fetchMrs: () => Promise<void>;
  fetchMrDetail: (projectId: number, iid: number) => Promise<DevBoardMRDetail | null>;
  startMrsAutoRefresh: () => void;
  stopMrsAutoRefresh: () => void;

  // Issues
  issues: Ref<DevBoardIssue[]>;
  issuesLoading: Ref<boolean>;
  fetchIssues: () => Promise<void>;
  fetchIssueDetail: (
    projectId: number,
    iid: number,
  ) => Promise<DevBoardIssueDetail | null>;
  startIssuesAutoRefresh: () => void;
  stopIssuesAutoRefresh: () => void;

  // Todos
  todos: Ref<DevBoardTodo[]>;
  mentionMrs: Ref<DevBoardMR[]>;
  todosLoading: Ref<boolean>;
  mentionMrsLoading: Ref<boolean>;
  todosError: Ref<string | null>;
  todoPanelOpen: Ref<boolean>;
  mentions: ComputedRef<DevBoardTodo[]>;
  pendingCount: ComputedRef<number>;
  fetchTodos: () => Promise<void>;
  fetchMentionMrs: () => Promise<void>;
  markAsDone: (id: number) => Promise<void>;
  markAllAsDone: () => Promise<void>;
  startTodosAutoRefresh: () => void;
  stopTodosAutoRefresh: () => void;

  // Metadata
  meta: ProviderMeta;
}
