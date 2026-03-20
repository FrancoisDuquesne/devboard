import type { ProviderMeta } from "~/types";

export const gitlabMeta: ProviderMeta = {
  id: "gitlab",
  name: "GitLab",
  mrLabel: "merge request",
  mrLabelPlural: "merge requests",
  mrPrefix: "!",
  icon: "i-simple-icons-gitlab",
  authCliCommand: "glab auth login",
  authEnvVars: { host: "GITLAB_HOST", token: "GITLAB_PRIVATE_TOKEN" },
  authTokenScope: "api",
  dashboardTodosPath: (host) => `https://${host}/dashboard/todos`,
};
