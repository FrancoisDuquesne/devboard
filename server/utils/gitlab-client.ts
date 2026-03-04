import { getGitLabBaseUrl, getGitLabToken } from "./gitlab-auth";

const REQUEST_TIMEOUT_MS = 15_000;
const MAX_PAGES = 50;
const MAX_ITEMS = 5_000;
const MAX_CONCURRENCY = 10;

interface FetchOptions {
  params?: Record<string, string | number | boolean>;
  method?: string;
}

export async function gitlabFetch<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const baseUrl = getGitLabBaseUrl();
  const token = getGitLabToken();

  return $fetch<T>(`${baseUrl}${path}`, {
    method: (options.method as "GET" | "POST" | "PUT" | "DELETE") ?? "GET",
    headers: {
      "PRIVATE-TOKEN": token,
    },
    params: options.params,
    timeout: REQUEST_TIMEOUT_MS,
  });
}

export async function gitlabFetchAllPages<T>(
  path: string,
  params: Record<string, string | number | boolean> = {},
): Promise<T[]> {
  const baseUrl = getGitLabBaseUrl();
  const token = getGitLabToken();
  const allItems: T[] = [];
  let page = 1;
  const perPage = 100;

  while (page <= MAX_PAGES) {
    const response = await $fetch.raw<T[]>(`${baseUrl}${path}`, {
      headers: {
        "PRIVATE-TOKEN": token,
      },
      params: {
        ...params,
        page,
        per_page: perPage,
      },
      timeout: REQUEST_TIMEOUT_MS,
    });

    const items = response._data;
    if (!items || items.length === 0) break;

    allItems.push(...items);

    if (allItems.length >= MAX_ITEMS) {
      console.warn(`gitlabFetchAllPages: hit item limit (${MAX_ITEMS}) at ${path}`);
      break;
    }

    const totalPages = Number(response.headers.get("x-total-pages")) || 1;
    if (page >= totalPages) break;
    page++;
  }

  return allItems;
}

/**
 * Run async tasks with bounded concurrency.
 * Prevents unbounded fan-out when enriching large MR lists.
 */
export async function mapWithConcurrency<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const i = index++;
      try {
        results[i] = { status: "fulfilled", value: await fn(items[i]) };
      } catch (reason) {
        results[i] = { status: "rejected", reason };
      }
    }
  }

  const workers = Array.from({ length: Math.min(MAX_CONCURRENCY, items.length) }, () =>
    worker(),
  );
  await Promise.all(workers);
  return results;
}
