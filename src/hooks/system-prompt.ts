import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { guidance } from "../guidance";

export function registerGuidance(pi: ExtensionAPI) {
  pi.on("before_agent_start", async (event) => {
    return {
      systemPrompt: `${event.systemPrompt}\n${guidance}`,
    };
  });
}
