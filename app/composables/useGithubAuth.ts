const status = ref<{
  connected: boolean;
  host: string;
  username?: string;
  name?: string;
  avatarUrl?: string;
  error?: string;
} | null>(null);

const loading = ref(false);
let initialized = false;

export function useGithubAuth() {
  const toast = useToast();

  async function checkConnection(opts?: { silent?: boolean }) {
    loading.value = true;
    try {
      status.value = await $fetch("/api/github/status");
      if (!opts?.silent) {
        if (status.value.connected) {
          toast.add({
            title: `Connected as ${status.value.username} on ${status.value.host}`,
            icon: "i-lucide-check-circle",
            color: "success",
          });
        } else {
          toast.add({
            title: "Connection failed",
            description: status.value.error || "Check your GITHUB_HOST and token.",
            icon: "i-lucide-alert-circle",
            color: "error",
          });
        }
      }
    } catch {
      status.value = {
        connected: false,
        host: "",
        error: "Failed to reach server",
      };
      if (!opts?.silent) {
        toast.add({
          title: "Connection failed",
          description: "Could not reach the DevBoard server.",
          icon: "i-lucide-alert-circle",
          color: "error",
        });
      }
    } finally {
      loading.value = false;
    }
  }

  // Auto-check on first use (silent — no toast on startup)
  if (!initialized) {
    initialized = true;
    checkConnection({ silent: true });
  }

  return {
    status,
    loading,
    checkConnection,
  };
}
