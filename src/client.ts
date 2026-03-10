import { LinearClient } from "@linear/sdk";
import { configLoader } from "./config";

let client: LinearClient | null = null;

/**
 * Resolve the API key from config (settings file) or environment.
 * Config takes precedence over env var.
 */
function resolveApiKey(): string | undefined {
  const config = configLoader.getConfig();
  return config.apiKey ?? process.env.LINEAR_API_KEY;
}

/**
 * Get or lazily initialize the Linear client.
 * Returns the client if credentials are available, null otherwise.
 */
export function getLinearClient(): LinearClient | null {
  if (client) return client;

  const apiKey = resolveApiKey();
  if (!apiKey) return null;

  client = new LinearClient({ apiKey });
  return client;
}

/**
 * Check whether Linear credentials are configured.
 */
export function hasLinearCredentials(): boolean {
  return !!resolveApiKey();
}

export const LINEAR_CREDENTIALS_ERROR = [
  "Linear API key not configured. Set it via:",
  "",
  "  1. /linear:settings command",
  "  2. Environment variable: export LINEAR_API_KEY=lin_api_...",
  "",
  "Get a key at: https://linear.app/settings/api",
].join("\n");
