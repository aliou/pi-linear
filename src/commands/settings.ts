import {
  registerSettingsCommand,
  SettingsDetailEditor,
  type SettingsSection,
} from "@aliou/pi-utils-settings";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import type { Component, SettingsListTheme } from "@mariozechner/pi-tui";
import {
  configLoader,
  type LinearConfig,
  type ResolvedLinearConfig,
} from "../config";

function createApiKeySubmenu(
  currentValue: string,
  done: (selectedValue?: string) => void,
  theme: SettingsListTheme,
  saveDraft: (apiKey: string) => void,
): Component {
  let value = currentValue === "(not set)" ? "" : currentValue;

  return new SettingsDetailEditor({
    title: "API Key",
    theme,
    onDone: () => done(value || undefined),
    fields: [
      {
        id: "apiKey",
        label: "API Key",
        type: "text",
        description:
          "Linear personal API key. Get one at https://linear.app/settings/api",
        getValue: () => value,
        setValue: (v) => {
          value = v;
          saveDraft(v);
        },
        emptyValueText: "(not set)",
      },
    ],
  });
}

function createAccessTokenSubmenu(
  currentValue: string,
  done: (selectedValue?: string) => void,
  theme: SettingsListTheme,
  saveDraft: (accessToken: string) => void,
): Component {
  let value = currentValue === "(not set)" ? "" : currentValue;

  return new SettingsDetailEditor({
    title: "OAuth Token",
    theme,
    onDone: () => done(value || undefined),
    fields: [
      {
        id: "accessToken",
        label: "OAuth Token",
        type: "text",
        description:
          "OAuth access token from a Linear app. Falls back to LINEAR_OAUTH_TOKEN env var if not set.",
        getValue: () => value,
        setValue: (v) => {
          value = v;
          saveDraft(v);
        },
        emptyValueText: "(not set)",
      },
    ],
  });
}

export function registerLinearSettings(pi: ExtensionAPI): void {
  registerSettingsCommand<LinearConfig, ResolvedLinearConfig>(pi, {
    commandName: "linear:settings",
    commandDescription: "Configure Linear extension settings",
    title: "Linear Settings",
    configStore: configLoader,
    buildSections: (
      tabConfig: LinearConfig | null,
      resolved: ResolvedLinearConfig,
      ctx,
    ): SettingsSection[] => {
      return [
        {
          label: "Authentication",
          items: [
            {
              id: "apiKey",
              label: "API Key",
              description:
                "Linear API key. Falls back to LINEAR_API_KEY env var if not set. " +
                "Get a key at https://linear.app/settings/api",
              currentValue:
                (tabConfig?.apiKey ?? resolved.apiKey) || "(not set)",
              submenu: (currentValue, done) =>
                createApiKeySubmenu(currentValue, done, ctx.theme, (apiKey) => {
                  const draft = structuredClone(
                    tabConfig ?? ({} as LinearConfig),
                  );
                  draft.apiKey = apiKey || undefined;
                  ctx.setDraft(draft);
                }),
            },
            {
              id: "accessToken",
              label: "OAuth Token",
              description:
                "OAuth access token from a Linear app. Falls back to LINEAR_OAUTH_TOKEN env var if not set.",
              currentValue:
                (tabConfig?.accessToken ?? resolved.accessToken) || "(not set)",
              submenu: (currentValue, done) =>
                createAccessTokenSubmenu(
                  currentValue,
                  done,
                  ctx.theme,
                  (accessToken) => {
                    const draft = structuredClone(
                      tabConfig ?? ({} as LinearConfig),
                    );
                    draft.accessToken = accessToken || undefined;
                    ctx.setDraft(draft);
                  },
                ),
            },
          ],
        },
        {
          label: "General",
          items: [
            {
              id: "enabled",
              label: "Enabled",
              description: "Enable or disable the extension",
              currentValue:
                (tabConfig?.enabled ?? resolved.enabled)
                  ? "enabled"
                  : "disabled",
              values: ["enabled", "disabled"],
            },
          ],
        },
      ];
    },
  });
}
