import type { LinearClient } from "@linear/sdk";

interface TeamEntry {
  id: string;
  key: string;
  name: string;
}

let cachedTeams: TeamEntry[] | null = null;

/** Clear the team cache (e.g. on client re-init). */
export function clearTeamCache(): void {
  cachedTeams = null;
}

/** Fetch and cache the workspace teams. */
async function ensureTeams(client: LinearClient): Promise<TeamEntry[]> {
  if (cachedTeams) return cachedTeams;

  const result = await client.teams();
  cachedTeams = result.nodes.map((t) => ({
    id: t.id,
    key: t.key,
    name: t.name,
  }));
  return cachedTeams;
}

/**
 * Resolve any team identifier (UUID, key like "GEN", or display name) to a
 * team UUID. Returns undefined if no match is found.
 */
export async function resolveTeamId(
  client: LinearClient,
  teamId?: string,
  teamKey?: string,
  teamName?: string,
): Promise<string | undefined> {
  if (teamId) {
    // Could already be a UUID -- but also accept a key passed as teamId.
    // Try exact UUID first, otherwise search by key/name.
    const teams = await ensureTeams(client);
    const byId = teams.find((t) => t.id === teamId);
    if (byId) return byId.id;
    // Fallback: maybe the caller passed a key like "GEN" as teamId.
    const byKey = teams.find(
      (t) => t.key.toLowerCase() === teamId.toLowerCase(),
    );
    if (byKey) return byKey.id;
    // Last resort: return as-is and let the API validate.
    return teamId;
  }

  const teams = await ensureTeams(client);

  if (teamKey) {
    return teams.find((t) => t.key.toLowerCase() === teamKey.toLowerCase())?.id;
  }

  if (teamName) {
    return teams.find((t) => t.name.toLowerCase() === teamName.toLowerCase())
      ?.id;
  }

  return undefined;
}
