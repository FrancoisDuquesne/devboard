/** Extract a safe error message for server-side logging (no stack traces sent to client). */
export function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  return "Unknown error";
}
