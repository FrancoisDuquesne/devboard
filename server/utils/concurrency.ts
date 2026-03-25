const MAX_CONCURRENCY = 10;

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
