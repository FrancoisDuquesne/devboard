import { DEMO_GITLAB_HOST, DEMO_USERS } from "./constants";

export interface ConnectionStatus {
  connected: boolean;
  host: string;
  username?: string;
  name?: string;
  avatarUrl?: string;
  error?: string;
}

export const demoStatus: ConnectionStatus = {
  connected: true,
  host: DEMO_GITLAB_HOST,
  username: DEMO_USERS.alex.username,
  name: DEMO_USERS.alex.name,
  avatarUrl: DEMO_USERS.alex.avatarUrl,
};
