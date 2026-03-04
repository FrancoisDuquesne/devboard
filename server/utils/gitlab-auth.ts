/**
 * GitLab authentication resolution.
 *
 * DevBoard reads credentials from two sources, in priority order:
 *
 * 1. **Environment variables** (recommended for deployment)
 *    - `GITLAB_HOST`           — plain hostname (e.g. `gitlab.example.com`)
 *    - `GITLAB_PRIVATE_TOKEN`  — personal access token with `api` scope
 *
 * 2. **glab CLI config** (zero-config for local development)
 *    - Run `glab auth login` once — host and token are stored in
 *      `~/.config/glab-cli/config.yml` and picked up automatically.
 *    - No env vars needed if glab is configured.
 *
 * Quick start:
 *   cp .env.example .env   # then fill in GITLAB_HOST and GITLAB_PRIVATE_TOKEN
 *   — or —
 *   glab auth login         # that's it — host and token are auto-detected
 */
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";
import yaml from "js-yaml";

interface GlabConfig {
  hosts?: Record<
    string,
    {
      token?: string;
      api_host?: string;
      api_protocol?: string;
      user?: string;
    }
  >;
}

const ALLOWED_PROTOCOLS = new Set(["http", "https"]);

function validateHost(host: string): string {
  const trimmed = host.trim();
  if (!trimmed || /[\s/\\?#@:]/.test(trimmed)) {
    throw new Error(
      `Invalid GITLAB_HOST value: "${trimmed}". Must be a plain hostname (e.g. gitlab.example.com).`,
    );
  }
  return trimmed;
}

function readGlabConfig(): GlabConfig | null {
  try {
    const configPath = resolve(homedir(), ".config/glab-cli/config.yml");
    const content = readFileSync(configPath, "utf-8");
    return yaml.load(content, { schema: yaml.JSON_SCHEMA }) as GlabConfig;
  } catch {
    return null;
  }
}

/** Resolved host: GITLAB_HOST env var → first host in glab CLI config */
export function getGitLabHost(): string {
  const envHost = process.env.GITLAB_HOST;
  if (envHost) return validateHost(envHost);

  // Fall back to the first host in glab CLI config
  const config = readGlabConfig();
  const hosts = config?.hosts ? Object.keys(config.hosts) : [];
  if (hosts.length > 0) return validateHost(hosts[0]);

  throw new Error(
    "No GitLab host found. Set GITLAB_HOST in .env, or run: glab auth login",
  );
}

/** Resolved token: GITLAB_PRIVATE_TOKEN env var → glab CLI config */
export function getGitLabToken(): string {
  const envToken = process.env.GITLAB_PRIVATE_TOKEN;
  if (envToken) return envToken;

  const host = getGitLabHost();
  const config = readGlabConfig();
  const hostConfig = config?.hosts?.[host];
  if (hostConfig?.token) return hostConfig.token;

  throw new Error(
    "No GitLab token found. Set GITLAB_PRIVATE_TOKEN in .env, or run: glab auth login",
  );
}

export function getGitLabBaseUrl(): string {
  const host = getGitLabHost();
  const config = readGlabConfig();
  const hostConfig = config?.hosts?.[host];

  const protocol = hostConfig?.api_protocol ?? "https";
  if (!ALLOWED_PROTOCOLS.has(protocol)) {
    throw new Error(
      `Unsupported protocol "${protocol}" in glab config. Only http and https are allowed.`,
    );
  }

  const apiHost = hostConfig?.api_host ?? host;
  return `${protocol}://${apiHost}/api/v4`;
}
