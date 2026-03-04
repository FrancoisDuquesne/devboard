/**
 * Generate a short alias from the last segment of a project path.
 * - "mission-control-center" → "MCC"
 * - "magic-baby" → "MB"
 * - "sigint" → "SIG"
 */
export function abbreviate(segment: string): string {
  const parts = segment.split(/[-_]/);
  if (parts.length > 1) {
    return parts.map((p) => p.charAt(0).toUpperCase()).join("");
  }
  return segment.slice(0, 3).toUpperCase();
}

/**
 * Get initials from a full project path (uses the last segment).
 *   "group/mission-control-center" → "MCC"
 */
export function getProjectInitials(projectPath?: string): string {
  if (!projectPath) return "";
  const last = projectPath.split("/").pop() ?? projectPath;
  return abbreviate(last);
}

/**
 * Compute short aliases for a list of project paths.
 * Handles collisions by prepending parent segment initials.
 */
export function computeProjectAliases(paths: string[]): Map<string, string> {
  const aliases = new Map<string, string>();
  const reverseMap = new Map<string, string[]>(); // alias → [paths]

  // First pass: generate alias from last segment
  for (const path of paths) {
    const segments = path.split("/");
    const last = segments[segments.length - 1];
    const alias = abbreviate(last);
    aliases.set(path, alias);

    const existing = reverseMap.get(alias) ?? [];
    existing.push(path);
    reverseMap.set(alias, existing);
  }

  // Second pass: resolve collisions by prepending parent initial
  for (const [alias, collisions] of reverseMap) {
    if (collisions.length <= 1) continue;

    for (const path of collisions) {
      const segments = path.split("/");
      if (segments.length >= 2) {
        const parent = segments[segments.length - 2];
        const parentInitial = abbreviate(parent);
        aliases.set(path, `${parentInitial}/${alias}`);
      }
    }
  }

  return aliases;
}
