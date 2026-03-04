import { getGitLabBaseUrl, getGitLabToken } from "./gitlab-auth";

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

  while (true) {
    const response = await $fetch.raw<T[]>(`${baseUrl}${path}`, {
      headers: {
        "PRIVATE-TOKEN": token,
      },
      params: {
        ...params,
        page,
        per_page: perPage,
      },
    });

    const items = response._data;
    if (!items || items.length === 0) break;

    allItems.push(...items);

    const totalPages = Number(response.headers.get("x-total-pages")) || 1;
    if (page >= totalPages) break;
    page++;
  }

  return allItems;
}
