import type { ProviderMeta } from "~/types";

export const githubMeta: ProviderMeta = {
  id: "github",
  name: "GitHub",
  mrLabel: "pull request",
  mrLabelPlural: "pull requests",
  mrPrefix: "#",
  icon: "i-simple-icons-github",
  authCliCommand: "gh auth login",
  authEnvVars: { host: "GITHUB_HOST", token: "GITHUB_TOKEN" },
  authTokenScope: "repo, notifications",
  authTokenExample: "ghp_xxxxxxxxxxxxxxxxxxxx",
  authHostExample: "github.com",
  dashboardTodosPath: (host) => `https://${host}/notifications`,
};
