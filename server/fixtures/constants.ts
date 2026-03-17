export const DEMO_GITLAB_HOST = "gitlab.example.com";

export const DEMO_PROJECTS = {
  platform: { id: 101, path: "acme/platform" },
  frontend: { id: 102, path: "acme/frontend" },
  infra: { id: 103, path: "acme/infra" },
} as const;

export function demoAvatar(seed: string): string {
  return `https://api.dicebear.com/7.x/avataaars-neutral/svg?seed=${seed}`;
}

export function demoUrl(projectPath: string, suffix: string): string {
  return `https://${DEMO_GITLAB_HOST}/${projectPath}/-/${suffix}`;
}

export const DEMO_USERS = {
  alex: {
    username: "alex.dev",
    name: "Alex Chen",
    avatarUrl: demoAvatar("alex.dev"),
  },
  sam: {
    username: "sam.backend",
    name: "Sam Nakamura",
    avatarUrl: demoAvatar("sam.backend"),
  },
  mika: {
    username: "mika.ui",
    name: "Mika Johansson",
    avatarUrl: demoAvatar("mika.ui"),
  },
  priya: {
    username: "priya.ops",
    name: "Priya Sharma",
    avatarUrl: demoAvatar("priya.ops"),
  },
  jordan: {
    username: "jordan.sre",
    name: "Jordan Rivera",
    avatarUrl: demoAvatar("jordan.sre"),
  },
} as const;
