/**
 * GitHub authentication resolution.
 *
 * DevBoard reads credentials from two sources, in priority order:
 *
 * 1. **Environment variables** (recommended for deployment)
 *    - `GITHUB_HOST`   — plain hostname (default: `github.com`)
 *    - `GITHUB_TOKEN`  — personal access token with `repo, notifications` scopes
 *
 * 2. **gh CLI config** (zero-config for local development)
 *    - Run `gh auth login` once — host and token are stored in
 *      `~/.config/gh/hosts.yml` and picked up automatically.
 *    - No env vars needed if gh is configured.
 *
 * Quick start:
 *   cp .env.example .env   # then fill in GITHUB_HOST and GITHUB_TOKEN
 *   — or —
 *   gh auth login           # that's it — host and token are auto-detected
 *
 * Credentials are resolved once on first use and cached for the process lifetime.
 */
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";
import yaml from "js-yaml";

interface GhHostsConfig {
  [host: string]: {
    oauth_token?: string;
    user?: string;
    git_protocol?: string;
  };
}

function validateHost(host: string): string {
  const trimmed = host.trim();
  if (!trimmed || /[\s/\\?#@:]/.test(trimmed)) {
    throw new Error(
      `Invalid GITHUB_HOST value: "${trimmed}". Must be a plain hostname (e.g. github.com).`,
    );
  }
  return trimmed;
}

// Memoize gh config read
let ghConfigCache: GhHostsConfig | null | undefined;

function readGhConfig(): GhHostsConfig | null {
  if (ghConfigCache !== undefined) return ghConfigCache;
  try {
    const configPath = resolve(homedir(), ".config/gh/hosts.yml");
    const content = readFileSync(configPath, "utf-8");
    ghConfigCache = yaml.load(content, {
      schema: yaml.JSON_SCHEMA,
    }) as GhHostsConfig;
  } catch {
    ghConfigCache = null;
  }
  return ghConfigCache;
}

// Memoize resolved credentials
let cachedHost: string | undefined;
let cachedToken: string | undefined;
let cachedBaseUrl: string | undefined;

/** Resolved host: GITHUB_HOST env var → first host in gh CLI config → github.com */
export function getGitHubHost(): string {
  if (cachedHost) return cachedHost;

  const envHost = process.env.GITHUB_HOST;
  if (envHost) {
    cachedHost = validateHost(envHost);
    return cachedHost;
  }

  // Fall back to the first host in gh CLI config
  const config = readGhConfig();
  const hosts = config ? Object.keys(config) : [];
  if (hosts.length > 0) {
    cachedHost = validateHost(hosts[0]);
    return cachedHost;
  }

  // Default to github.com
  cachedHost = "github.com";
  return cachedHost;
}

/** Resolved token: GITHUB_TOKEN env var → gh CLI config */
export function getGitHubToken(): string {
  if (cachedToken) return cachedToken;

  const envToken = process.env.GITHUB_TOKEN;
  if (envToken) {
    cachedToken = envToken;
    return cachedToken;
  }

  const host = getGitHubHost();
  const config = readGhConfig();
  const hostConfig = config?.[host];
  if (hostConfig?.oauth_token) {
    cachedToken = hostConfig.oauth_token;
    return cachedToken;
  }

  throw new Error(
    "No GitHub token found. Set GITHUB_TOKEN in .env, or run: gh auth login",
  );
}

/** API base URL: github.com → api.github.com, enterprise → {host}/api/v3 */
export function getGitHubApiBaseUrl(): string {
  if (cachedBaseUrl) return cachedBaseUrl;

  const host = getGitHubHost();
  cachedBaseUrl =
    host === "github.com" ? "https://api.github.com" : `https://${host}/api/v3`;
  return cachedBaseUrl;
}
