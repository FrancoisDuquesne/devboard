export type ProviderId = "gitlab";

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
  dashboardTodosPath: (host: string) => string;
}
