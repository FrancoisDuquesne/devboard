import { useLocalStorage } from "@vueuse/core";

const hasSeenWelcome = useLocalStorage("devboard:has-seen-welcome", false);
const welcomeOpen = ref(false);

export function useOnboarding() {
  function showWelcomeIfFirstRun() {
    // nextTick ensures useLocalStorage has hydrated from storage
    nextTick(() => {
      if (!hasSeenWelcome.value) {
        welcomeOpen.value = true;
      }
    });
  }

  function dismissWelcome() {
    welcomeOpen.value = false;
    hasSeenWelcome.value = true;
  }

  function resetWelcome() {
    hasSeenWelcome.value = false;
    welcomeOpen.value = true;
  }

  return {
    welcomeOpen,
    hasSeenWelcome,
    showWelcomeIfFirstRun,
    dismissWelcome,
    resetWelcome,
  };
}
