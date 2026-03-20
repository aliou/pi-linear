import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { hasLinearCredentials, LINEAR_CREDENTIALS_ERROR } from "./client";
import { registerLinearSettings } from "./commands/settings";
import { configLoader } from "./config";
import { registerTools } from "./tools/index";

export default async function (pi: ExtensionAPI) {
  await configLoader.load();
  const config = configLoader.getConfig();

  if (!config.enabled) return;

  // Always register settings so users can configure the API key.
  registerLinearSettings(pi);

  if (!hasLinearCredentials()) {
    pi.on("session_start", (_event, ctx) => {
      if (ctx.hasUI) {
        ctx.ui.notify(LINEAR_CREDENTIALS_ERROR, "warning");
      }
    });
    return;
  }

  registerTools(pi);
}
