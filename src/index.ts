import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { hasLinearCredentials, LINEAR_CREDENTIALS_ERROR } from "./client";
import { registerLinearAuth } from "./commands/auth";
import { registerLinearSettings } from "./commands/settings";
import { configLoader } from "./config";
import { registerHooks } from "./hooks";
import { registerTools } from "./tools/index";

export default async function (pi: ExtensionAPI) {
  await configLoader.load();
  const config = configLoader.getConfig();

  if (!config.enabled) return;

  // Always register auth + settings so users can manage credentials.
  registerLinearAuth(pi);
  registerLinearSettings(pi);

  if (!hasLinearCredentials()) {
    pi.on("session_start", (_event, ctx) => {
      if (ctx.hasUI) {
        ctx.ui.notify(LINEAR_CREDENTIALS_ERROR, "warning");
      }
    });
    return;
  }

  registerHooks(pi);
  registerTools(pi);
}
