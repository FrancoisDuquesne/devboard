import { getGitHubApiBaseUrl, getGitHubToken } from "./github-auth";
import { mapWithConcurrency } from "./gitlab-client";

const REQUEST_TIMEOUT_MS = 15_000;
const MAX_PAGES = 50;
const MAX_ITEMS = 5_000;

interface FetchOptions {
  params?: Record<string, string | number | boolean>;
  method?: string;
}

export { mapWithConcurrency };

export async function githubFetch<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const baseUrl = getGitHubApiBaseUrl();
  const token = getGitHubToken();

  return $fetch<T>(`${baseUrl}${path}`, {
    method: (options.method as "GET" | "POST" | "PUT" | "DELETE" | "PATCH") ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    },
    params: options.params,
    timeout: REQUEST_TIMEOUT_MS,
  });
}

const LINK_NEXT_RE = /<([^>]+)>;\s*rel="next"/;

export async function githubFetchAllPages<T>(
  path: string,
  params: Record<string, string | number | boolean> = {},
): Promise<T[]> {
  const baseUrl = getGitHubApiBaseUrl();
  const token = getGitHubToken();
  const allItems: T[] = [];
  let url: string | null = `${baseUrl}${path}`;
  let page = 0;

  while (url && page < MAX_PAGES) {
    const response = await $fetch.raw<T[]>(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
      params: page === 0 ? { ...params, per_page: 100 } : undefined,
      timeout: REQUEST_TIMEOUT_MS,
    });

    const items = response._data;
    if (!items || items.length === 0) break;

    allItems.push(...items);

    if (allItems.length >= MAX_ITEMS) {
      console.warn(`githubFetchAllPages: hit item limit (${MAX_ITEMS}) at ${path}`);
      break;
    }

    // Parse Link header for next page URL
    const linkHeader = response.headers.get("link");
    const nextMatch = linkHeader?.match(LINK_NEXT_RE);
    url = nextMatch ? nextMatch[1] : null;
    page++;
  }

  return allItems;
}
