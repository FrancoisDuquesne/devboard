/**
 * Reactive "now" that ticks every `interval` ms.
 * Used to drive live-updating relative timestamps.
 */
export function useNow(interval = 30000) {
  const now = ref(Date.now());
  let timer: ReturnType<typeof setInterval> | null = null;

  onMounted(() => {
    timer = setInterval(() => {
      now.value = Date.now();
    }, interval);
  });

  onUnmounted(() => {
    if (timer) clearInterval(timer);
  });

  return now;
}
