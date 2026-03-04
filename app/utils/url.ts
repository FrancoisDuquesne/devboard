/** Check that a URL uses http or https — blocks javascript:, data:, etc. */
export function isSafeUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

/** Open a URL in a new tab, only if it uses a safe protocol. */
export function safeOpen(url: string | null | undefined): void {
  if (url && isSafeUrl(url)) {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
