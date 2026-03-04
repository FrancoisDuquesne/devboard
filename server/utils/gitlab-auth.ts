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
 *
 * Credentials are resolved once on first use and cached for the process lifetime.
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

// Memoize glab config read — avoids synchronous filesystem reads on every request
let glabConfigCache: GlabConfig | null | undefined;

function readGlabConfig(): GlabConfig | null {
  if (glabConfigCache !== undefined) return glabConfigCache;
  try {
    const configPath = resolve(homedir(), ".config/glab-cli/config.yml");
    const content = readFileSync(configPath, "utf-8");
    glabConfigCache = yaml.load(content, {
      schema: yaml.JSON_SCHEMA,
    }) as GlabConfig;
  } catch {
    glabConfigCache = null;
  }
  return glabConfigCache;
}

// Memoize resolved credentials
let cachedHost: string | undefined;
let cachedToken: string | undefined;
let cachedBaseUrl: string | undefined;

/** Resolved host: GITLAB_HOST env var → first host in glab CLI config */
export function getGitLabHost(): string {
  if (cachedHost) return cachedHost;

  const envHost = process.env.GITLAB_HOST;
  if (envHost) {
    cachedHost = validateHost(envHost);
    return cachedHost;
  }

  // Fall back to the first host in glab CLI config
  const config = readGlabConfig();
  const hosts = config?.hosts ? Object.keys(config.hosts) : [];
  if (hosts.length > 0) {
    cachedHost = validateHost(hosts[0]);
    return cachedHost;
  }

  throw new Error(
    "No GitLab host found. Set GITLAB_HOST in .env, or run: glab auth login",
  );
}

/** Resolved token: GITLAB_PRIVATE_TOKEN env var → glab CLI config */
export function getGitLabToken(): string {
  if (cachedToken) return cachedToken;

  const envToken = process.env.GITLAB_PRIVATE_TOKEN;
  if (envToken) {
    cachedToken = envToken;
    return cachedToken;
  }

  const host = getGitLabHost();
  const config = readGlabConfig();
  const hostConfig = config?.hosts?.[host];
  if (hostConfig?.token) {
    cachedToken = hostConfig.token;
    return cachedToken;
  }

  throw new Error(
    "No GitLab token found. Set GITLAB_PRIVATE_TOKEN in .env, or run: glab auth login",
  );
}

export function getGitLabBaseUrl(): string {
  if (cachedBaseUrl) return cachedBaseUrl;

  const host = getGitLabHost();
  const config = readGlabConfig();
  const hostConfig = config?.hosts?.[host];

  const protocol = hostConfig?.api_protocol ?? "https";
  if (!ALLOWED_PROTOCOLS.has(protocol)) {
    throw new Error(
      `Unsupported protocol "${protocol}" in glab config. Only http and https are allowed.`,
    );
  }

  const rawApiHost = hostConfig?.api_host ?? host;
  const apiHost = validateHost(rawApiHost);
  cachedBaseUrl = `${protocol}://${apiHost}/api/v4`;
  return cachedBaseUrl;
}
