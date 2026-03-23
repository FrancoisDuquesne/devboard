import { useLocalStorage } from "@vueuse/core";

const seenTimestamps = useLocalStorage<Record<string, number>>(
  "devboard:seen-nodes",
  {},
);

export function useSeenNodes() {
  function markSeen(nodeId: string) {
    seenTimestamps.value = { ...seenTimestamps.value, [nodeId]: Date.now() };
  }

  function isUnseen(nodeId: string, updatedAt: string | undefined): boolean {
    if (!updatedAt) return false;
    const lastSeen = seenTimestamps.value[nodeId];
    if (!lastSeen) return true;
    return new Date(updatedAt).getTime() > lastSeen;
  }

  return { markSeen, isUnseen };
}
