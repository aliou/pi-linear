import { ToolBody, ToolCallHeader, ToolFooter } from "@aliou/pi-utils-ui";
import type {
  AgentToolResult,
  AgentToolUpdateCallback,
  ExtensionAPI,
  ExtensionContext,
  Theme,
  ToolRenderResultOptions,
} from "@mariozechner/pi-coding-agent";
import { type Component, Spacer, Text } from "@mariozechner/pi-tui";
import { Type } from "@sinclair/typebox";
import { getLinearClient, LINEAR_CREDENTIALS_ERROR } from "../../client";
import { type CreateProjectParams, createProject } from "./actions/create";
import { type ListProjectsParams, listProjects } from "./actions/list";
import { type ShowProjectParams, showProject } from "./actions/show";
import { type UpdateProjectParams, updateProject } from "./actions/update";
import { renderProjectExpanded } from "./render";
import type { SerializedProject } from "./types";

const ProjectsParams = Type.Object({
  action: Type.Union(
    [
      Type.Literal("show"),
      Type.Literal("create"),
      Type.Literal("list"),
      Type.Literal("update"),
    ],
    {
      description: "Action to perform: show, create, list, or update projects.",
    },
  ),
  id: Type.Optional(
    Type.String({ description: "Project ID. Required for show and update." }),
  ),
  limit: Type.Optional(
    Type.Number({ description: "Maximum results to return for list." }),
  ),
  includeArchived: Type.Optional(
    Type.Boolean({ description: "Include archived projects in list." }),
  ),
  statusId: Type.Optional(Type.String({ description: "Project status ID." })),
  statusName: Type.Optional(
    Type.String({ description: "Project status name." }),
  ),
  leadId: Type.Optional(Type.String({ description: "Project lead user ID." })),
  leadName: Type.Optional(
    Type.String({ description: "Project lead display name." }),
  ),
  teamId: Type.Optional(Type.String({ description: "Team ID." })),
  teamKey: Type.Optional(Type.String({ description: "Team key, e.g. ENG." })),
  teamName: Type.Optional(Type.String({ description: "Team name." })),
  name: Type.Optional(Type.String({ description: "Project name." })),
  teamIds: Type.Optional(
    Type.Array(Type.String(), {
      description: "Team IDs to associate with the project.",
    }),
  ),
  description: Type.Optional(
    Type.String({ description: "Project description." }),
  ),
  priority: Type.Optional(
    Type.Number({
      description: "Priority: 0=None, 1=Urgent, 2=High, 3=Normal, 4=Low.",
      minimum: 0,
      maximum: 4,
    }),
  ),
  startDate: Type.Optional(
    Type.String({ description: "Start date (YYYY-MM-DD)." }),
  ),
  targetDate: Type.Optional(
    Type.String({ description: "Target date (YYYY-MM-DD)." }),
  ),
  content: Type.Optional(
    Type.String({ description: "Project content in markdown." }),
  ),
});

type ProjectsParamsType = { action: string; [key: string]: unknown };

interface ProjectsDetails {
  action: string;
  project?: SerializedProject;
  projects?: SerializedProject[];
  error?: string;
}

type ExecuteResult = AgentToolResult<ProjectsDetails>;

const COLLAPSED_MAX = 5;
const CONTENT_MAX = 20;

function formatProjectForContent(project: SerializedProject): string {
  const parts = [
    `${project.name} (id=${project.id})`,
    `status=${project.state}`,
    `priority=${project.priorityLabel}`,
    `progress=${Math.round(project.progress * 100)}%`,
  ];
  if (project.lead) parts.push(`lead=${project.lead}`);
  if (project.teams.length > 0) parts.push(`teams=${project.teams.join(", ")}`);
  parts.push(`url=${project.url}`);
  return parts.join(" | ");
}

function formatProjectListContent(projects: SerializedProject[]): string {
  const header = `Listed ${projects.length} projects.`;
  if (projects.length === 0) return header;

  const lines = projects
    .slice(0, CONTENT_MAX)
    .map((project) => `- ${formatProjectForContent(project)}`);
  if (projects.length > CONTENT_MAX) {
    lines.push(`- + ${projects.length - CONTENT_MAX} more`);
  }
  return `${header}\n${lines.join("\n")}`;
}

function renderProjectOneLiner(project: SerializedProject, theme: Theme): Text {
  const parts = [
    theme.fg("accent", theme.bold(project.name)),
    project.state,
    `${Math.round(project.progress * 100)}%`,
  ];
  return new Text(parts.join(theme.fg("dim", " | ")), 0, 0);
}

function renderProjectListItem(project: SerializedProject, theme: Theme): Text {
  const titleParts = [theme.fg("accent", theme.bold(project.name))];
  if (project.description) {
    titleParts.push(theme.fg("dim", project.description));
  }
  const meta = [
    `${theme.fg("muted", "Status: ")}${project.state}`,
    `${theme.fg("muted", "Priority: ")}${project.priorityLabel}`,
    `${theme.fg("muted", "Progress: ")}${Math.round(project.progress * 100)}%`,
  ];
  if (project.lead) {
    meta.push(`${theme.fg("muted", "Lead: ")}${project.lead}`);
  }
  return new Text(
    `${titleParts.join(" - ")}\n${meta.join(theme.fg("dim", " | "))}`,
    0,
    0,
  );
}

export function registerProjectsTool(pi: ExtensionAPI) {
  pi.registerTool<typeof ProjectsParams, ProjectsDetails>({
    name: "linear_projects",
    label: "Linear: Projects",
    description: "Manage Linear projects. Actions: show, create, list, update.",
    parameters: ProjectsParams,

    async execute(
      _toolCallId: string,
      params: ProjectsParamsType,
      _signal: AbortSignal | undefined,
      onUpdate: AgentToolUpdateCallback<ProjectsDetails> | undefined,
      _ctx: ExtensionContext,
    ): Promise<ExecuteResult> {
      const client = getLinearClient();
      if (!client) {
        return {
          content: [{ type: "text", text: LINEAR_CREDENTIALS_ERROR }],
          details: { action: params.action, error: LINEAR_CREDENTIALS_ERROR },
        };
      }

      onUpdate?.({
        content: [
          { type: "text", text: `Running projects.${params.action}...` },
        ],
        details: { action: params.action },
      });

      let result:
        | { project?: SerializedProject; error?: string }
        | { projects?: SerializedProject[]; error?: string };

      switch (params.action) {
        case "show":
          result = await showProject(
            client,
            params as unknown as ShowProjectParams,
          );
          break;
        case "create":
          result = await createProject(
            client,
            params as unknown as CreateProjectParams,
          );
          break;
        case "list":
          result = await listProjects(
            client,
            params as unknown as ListProjectsParams,
          );
          break;
        case "update":
          result = await updateProject(
            client,
            params as unknown as UpdateProjectParams,
          );
          break;
        default:
          result = { error: `Unknown action: ${params.action}` };
      }

      if (result.error) {
        return {
          content: [{ type: "text", text: `Error: ${result.error}` }],
          details: { action: params.action, error: result.error },
        };
      }

      if ("projects" in result && result.projects) {
        return {
          content: [
            {
              type: "text",
              text: formatProjectListContent(result.projects),
            },
          ],
          details: { action: params.action, projects: result.projects },
        };
      }

      const project = (
        "project" in result ? result.project : undefined
      ) as SerializedProject;
      const verb =
        params.action === "create"
          ? "Created"
          : params.action === "update"
            ? "Updated"
            : "Found";
      const summary = [
        `${verb} project: ${project.name} (id=${project.id})`,
        `Status: ${project.state} | Priority: ${project.priorityLabel} | Progress: ${Math.round(project.progress * 100)}%`,
      ];
      if (project.lead) summary.push(`Lead: ${project.lead}`);
      if (project.teams.length > 0)
        summary.push(`Teams: ${project.teams.join(", ")}`);
      summary.push(`URL: ${project.url}`);
      if (project.description) summary.push(`\n${project.description}`);
      return {
        content: [{ type: "text", text: summary.join("\n") }],
        details: { action: params.action, project },
      };
    },

    renderCall(args: ProjectsParamsType, theme: Theme) {
      const action = String(args.action ?? "");
      switch (action) {
        case "show":
          return new ToolCallHeader(
            { toolName: "Linear Projects", action: "Show" },
            theme,
          );
        case "create":
          return new ToolCallHeader(
            {
              toolName: "Linear Projects",
              action: "Create",
              mainArg: String(args.name ?? ""),
            },
            theme,
          );
        case "list":
          return new ToolCallHeader(
            { toolName: "Linear Projects", action: "List" },
            theme,
          );
        case "update":
          return new ToolCallHeader(
            {
              toolName: "Linear Projects",
              action: "Update",
              mainArg: String(args.id ?? ""),
            },
            theme,
          );
        default:
          return new ToolCallHeader(
            { toolName: "Linear Projects", action },
            theme,
          );
      }
    },

    renderResult(
      result: AgentToolResult<ProjectsDetails>,
      options: ToolRenderResultOptions,
      theme: Theme,
    ) {
      const { details } = result;

      if (!details) {
        const text = result.content[0];
        return new Text(
          text?.type === "text" && text.text ? text.text : "No result",
          0,
          0,
        );
      }

      if (details.error) {
        return new Text(theme.fg("error", details.error), 0, 0);
      }

      if (details.projects) {
        const fields: Array<
          | { label: string; value: string; showCollapsed?: boolean }
          | (Component & { showCollapsed?: boolean })
        > = [];

        if (options.expanded) {
          details.projects.forEach((project, index) => {
            if (index > 0) fields.push(new Spacer(1));
            fields.push(renderProjectListItem(project, theme));
          });
        } else {
          const summaryLabel = `${details.projects.length} project${details.projects.length === 1 ? "" : "s"}`;
          const summaryText = new Text(
            theme.fg("accent", theme.bold(summaryLabel)),
            0,
            0,
          );
          Object.assign(summaryText, { showCollapsed: true });
          fields.push(summaryText);

          const collapsedSlice = details.projects.slice(0, COLLAPSED_MAX);
          for (const project of collapsedSlice) {
            const line = renderProjectOneLiner(project, theme);
            Object.assign(line, { showCollapsed: true });
            fields.push(line);
          }
          if (details.projects.length > COLLAPSED_MAX) {
            const more = new Text(
              theme.fg(
                "dim",
                `+ ${details.projects.length - COLLAPSED_MAX} more`,
              ),
              0,
              0,
            );
            Object.assign(more, { showCollapsed: true });
            fields.push(more);
          }
        }

        return new ToolBody(
          {
            fields,
            footer: options.expanded
              ? new ToolFooter(theme, {
                  items: [
                    {
                      value: `${details.projects.length} project${details.projects.length === 1 ? "" : "s"}`,
                      tone: "muted",
                    },
                  ],
                })
              : undefined,
            includeSpacerBeforeFooter: fields.length > 0,
          },
          options,
          theme,
        );
      }

      const project = details.project;
      if (!project) {
        return new Text(theme.fg("warning", "No project returned"), 0, 0);
      }

      const titleParts = [theme.fg("accent", theme.bold(project.name))];
      if (project.description) {
        titleParts.push(theme.fg("dim", project.description));
      }
      const titleText = new Text(titleParts.join(" - "), 0, 0);
      Object.assign(titleText, { showCollapsed: true });

      const fields: Array<
        | { label: string; value: string; showCollapsed?: boolean }
        | (Component & { showCollapsed?: boolean })
      > = [titleText];

      if (options.expanded) {
        for (const component of renderProjectExpanded(project, theme)) {
          fields.push(component);
        }
      }

      return new ToolBody(
        {
          fields,
          footer: new ToolFooter(theme, {
            items: [
              { label: "Status", value: project.state, tone: "accent" },
              {
                label: "Priority",
                value: project.priorityLabel,
                tone: "muted",
              },
            ],
          }),
        },
        options,
        theme,
      );
    },
  });
}
