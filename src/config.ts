import { buildSchemaUrl, ConfigLoader } from "@aliou/pi-utils-settings";
import pkg from "../package.json" with { type: "json" };

/**
 * Raw config shape (what gets saved to disk).
 * All fields optional -- only overrides are stored.
 *
 * JSDoc comments on fields become `description` in the generated JSON Schema.
 * Run `pnpm gen:schema` after changing this interface.
 */
export interface LinearConfig {
  /** Enable or disable the extension. */
  enabled?: boolean;
  /** Linear API key. If not set, falls back to LINEAR_API_KEY env var. */
  apiKey?: string;
}

/**
 * Resolved config (defaults merged in).
 */
export interface ResolvedLinearConfig {
  enabled: boolean;
  apiKey: string | undefined;
}

const DEFAULTS: ResolvedLinearConfig = {
  enabled: true,
  apiKey: undefined,
};

const schemaUrl = buildSchemaUrl(pkg.name, pkg.version);

/**
 * Config loader instance.
 * Config is stored at ~/.pi/agent/extensions/pi-linear.json
 */
export const configLoader = new ConfigLoader<
  LinearConfig,
  ResolvedLinearConfig
>("linear", DEFAULTS, { schemaUrl });
