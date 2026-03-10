import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { registerIssuesTool } from "./issues/index";
import { registerProjectsTool } from "./projects/index";
import { registerTeamsTool } from "./teams/index";

export function registerTools(pi: ExtensionAPI): void {
  registerIssuesTool(pi);
  registerProjectsTool(pi);
  registerTeamsTool(pi);
}
