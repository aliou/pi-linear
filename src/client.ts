import { LinearClient } from "@linear/sdk";
import { configLoader } from "./config";

const clients = new Map<string, LinearClient>();

function getClientKey(workspace?: string): string {
  const resolvedWorkspace =
    workspace ?? configLoader.getConfig().activeWorkspace;
  return resolvedWorkspace ? `workspace:${resolvedWorkspace}` : "env";
}

function resolveApiKey(workspace?: string): string | undefined {
  const config = configLoader.getConfig();

  if (workspace) {
    return config.workspaces[workspace]?.apiKey ?? process.env.LINEAR_API_KEY;
  }

  return config.apiKey;
}

export function getLinearClient(workspace?: string): LinearClient | null {
  const clientKey = getClientKey(workspace);
  const existing = clients.get(clientKey);
  if (existing) return existing;

  const apiKey = resolveApiKey(workspace);
  if (!apiKey) return null;

  const client = new LinearClient({ apiKey });
  clients.set(clientKey, client);
  return client;
}

export function clearClients(): void {
  clients.clear();
}

export function hasLinearCredentials(): boolean {
  const config = configLoader.getConfig();
  if (process.env.LINEAR_API_KEY) return true;
  return Object.values(config.workspaces).some(
    (workspace) => !!workspace.apiKey,
  );
}

export const LINEAR_CREDENTIALS_ERROR = [
  "Linear API key not configured. Set it via:",
  "",
  "  1. /linear:auth command",
  "  2. /linear:settings command",
  "  3. Environment variable: export LINEAR_API_KEY=lin_api_...",
  "",
  "Get a key at: https://linear.app/settings/api",
].join("\n");
