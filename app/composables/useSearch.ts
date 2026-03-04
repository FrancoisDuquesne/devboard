import type { DevBoardMR } from "~/types";

const searchOpen = ref(false);
const selectedMr = ref<DevBoardMR | null>(null);

export function useSearch() {
  return { searchOpen, selectedMr };
}
