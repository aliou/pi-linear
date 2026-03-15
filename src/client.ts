import { LinearClient } from "@linear/sdk";
import { configLoader } from "./config";

let client: LinearClient | null = null;

/**
 * Resolve Linear credentials from env vars and config.
 * Priority: LINEAR_OAUTH_TOKEN env > LINEAR_API_KEY env > config accessToken > config apiKey.
 * Returns the options to pass to LinearClient, or null if no credentials found.
 */
function resolveCredentials():
  | { accessToken: string }
  | { apiKey: string }
  | null {
  const envOauthToken = process.env.LINEAR_OAUTH_TOKEN;
  if (envOauthToken) {
    return { accessToken: envOauthToken };
  }

  const envApiKey = process.env.LINEAR_API_KEY;
  if (envApiKey) {
    return { apiKey: envApiKey };
  }

  const config = configLoader.getConfig();

  if (config.accessToken) {
    return { accessToken: config.accessToken };
  }

  if (config.apiKey) {
    return { apiKey: config.apiKey };
  }

  return null;
}

/**
 * Get or lazily initialize the Linear client.
 * Returns the client if credentials are available, null otherwise.
 */
export function getLinearClient(): LinearClient | null {
  if (client) return client;

  const credentials = resolveCredentials();
  if (!credentials) return null;

  client = new LinearClient(credentials);
  return client;
}

/**
 * Check whether Linear credentials are configured.
 */
export function hasLinearCredentials(): boolean {
  return !!resolveCredentials();
}

export const LINEAR_CREDENTIALS_ERROR = [
  "Linear credentials not configured. Set one via:",
  "",
  "  1. /linear:settings command (API key or OAuth token)",
  "  2. Environment variable: export LINEAR_API_KEY=lin_api_...",
  "  3. Environment variable: export LINEAR_OAUTH_TOKEN=lin_oauth_...",
  "",
  "API keys: https://linear.app/settings/api",
].join("\n");
