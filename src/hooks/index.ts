import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { registerGuidance } from "./system-prompt";

export function registerHooks(pi: ExtensionAPI) {
  registerGuidance(pi);
}
