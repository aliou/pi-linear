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
import { type CreateIssueParams, createIssue } from "./actions/create";
import { type ListIssuesParams, listIssues } from "./actions/list";
import { type SearchIssuesParams, searchIssues } from "./actions/search";
import { type ShowIssueParams, showIssue } from "./actions/show";
import { type UpdateIssueParams, updateIssue } from "./actions/update";
import { renderIssueChildren, renderIssueExpanded } from "./render";
import type { SerializedIssue } from "./types";

const IssuesParams = Type.Object({
  action: Type.Union(
    [
      Type.Literal("show"),
      Type.Literal("create"),
      Type.Literal("list"),
      Type.Literal("search"),
      Type.Literal("update"),
    ],
    {
      description:
        "Action to perform: show, create, list, search, or update issues.",
    },
  ),
  id: Type.Optional(
    Type.String({
      description:
        "Issue ID or identifier (e.g. ENG-123). Required for show and update.",
    }),
  ),
  query: Type.Optional(
    Type.String({ description: "Search query. Required for search." }),
  ),
  limit: Type.Optional(
    Type.Number({ description: "Maximum results to return for list/search." }),
  ),
  includeArchived: Type.Optional(
    Type.Boolean({ description: "Include archived issues in list/search." }),
  ),
  stateId: Type.Optional(Type.String({ description: "Workflow state ID." })),
  stateName: Type.Optional(
    Type.String({ description: "Workflow state name." }),
  ),
  assigneeId: Type.Optional(Type.String({ description: "Assignee user ID." })),
  assigneeName: Type.Optional(
    Type.String({ description: "Assignee display name." }),
  ),
  projectId: Type.Optional(Type.String({ description: "Project ID." })),
  projectName: Type.Optional(Type.String({ description: "Project name." })),
  teamId: Type.Optional(
    Type.String({
      description:
        "Team ID (UUID). Required for create. For list/search, can use teamKey or teamName instead.",
    }),
  ),
  teamKey: Type.Optional(
    Type.String({
      description: "Team key (e.g. ENG). Used as filter for list/search.",
    }),
  ),
  teamName: Type.Optional(
    Type.String({
      description: "Team name. Used as filter for list/search.",
    }),
  ),
  labelId: Type.Optional(Type.String({ description: "Label ID." })),
  labelName: Type.Optional(Type.String({ description: "Label name." })),
  title: Type.Optional(
    Type.String({ description: "Issue title. Required for create." }),
  ),
  description: Type.Optional(
    Type.String({ description: "Issue description in markdown." }),
  ),
  priority: Type.Optional(
    Type.Number({
      description: "Priority: 0=None, 1=Urgent, 2=High, 3=Normal, 4=Low.",
      minimum: 0,
      maximum: 4,
    }),
  ),
  labelIds: Type.Optional(
    Type.Array(Type.String(), { description: "Label IDs." }),
  ),
  dueDate: Type.Optional(
    Type.String({ description: "Due date (YYYY-MM-DD)." }),
  ),
  estimate: Type.Optional(Type.Number({ description: "Complexity estimate." })),
  parentId: Type.Optional(
    Type.String({ description: "Parent issue ID for sub-issues." }),
  ),
  includeCompleted: Type.Optional(
    Type.Boolean({
      description: "Include issues in completed states. Default false.",
    }),
  ),
  includeCanceled: Type.Optional(
    Type.Boolean({
      description:
        "Include issues in canceled/duplicate states. Default false.",
    }),
  ),
  includeSubIssues: Type.Optional(
    Type.Boolean({
      description: "Include sub-issues (issues with a parent). Default false.",
    }),
  ),
});

type IssuesParamsType = { action: string; [key: string]: unknown };

interface IssuesDetails {
  action: string;
  issue?: SerializedIssue;
  children?: SerializedIssue[];
  issues?: SerializedIssue[];
  totalCount?: number;
  error?: string;
}

type ExecuteResult = AgentToolResult<IssuesDetails>;

const COLLAPSED_MAX = 5;
const CONTENT_MAX = 20;

function formatIssueForContent(issue: SerializedIssue): string {
  const parts = [
    `${issue.identifier}: ${issue.title}`,
    `status=${issue.state}`,
    `priority=${issue.priorityLabel}`,
    `team=${issue.team}`,
  ];
  if (issue.project) parts.push(`project=${issue.project}`);
  if (issue.assignee) parts.push(`assignee=${issue.assignee}`);
  parts.push(`url=${issue.url}`);
  return parts.join(" | ");
}

function formatIssueListContent(
  issues: SerializedIssue[],
  action: string,
  totalCount?: number,
): string {
  const header =
    action === "search" && typeof totalCount === "number"
      ? `Found ${totalCount} issues. Showing ${issues.length}.`
      : `Listed ${issues.length} issues.`;

  if (issues.length === 0) return header;

  const lines = issues
    .slice(0, CONTENT_MAX)
    .map((issue) => `- ${formatIssueForContent(issue)}`);
  if (issues.length > CONTENT_MAX) {
    lines.push(`- + ${issues.length - CONTENT_MAX} more`);
  }
  return `${header}\n${lines.join("\n")}`;
}

function renderIssueOneLiner(issue: SerializedIssue, theme: Theme): Text {
  const parts = [
    `${theme.fg("accent", theme.bold(issue.identifier))} ${issue.title}`,
    issue.state,
    issue.priorityLabel,
  ];
  return new Text(parts.join(theme.fg("dim", " | ")), 0, 0);
}

function renderIssueListItem(issue: SerializedIssue, theme: Theme): Text {
  const line1 = `${theme.fg("accent", theme.bold(issue.identifier))} ${issue.title}`;
  const meta = [
    `${theme.fg("muted", "Status: ")}${issue.state}`,
    `${theme.fg("muted", "Priority: ")}${issue.priorityLabel}`,
  ];
  if (issue.assignee) {
    meta.push(`${theme.fg("muted", "Assignee: ")}${issue.assignee}`);
  }
  if (issue.project) {
    meta.push(`${theme.fg("muted", "Project: ")}${issue.project}`);
  }
  return new Text(`${line1}\n${meta.join(theme.fg("dim", " | "))}`, 0, 0);
}

export function registerIssuesTool(pi: ExtensionAPI) {
  pi.registerTool<typeof IssuesParams, IssuesDetails>({
    name: "linear_issues",
    label: "Linear: Issues",
    description:
      "Manage Linear issues. Actions: show, create, list, search, update.",
    parameters: IssuesParams,

    async execute(
      _toolCallId: string,
      params: IssuesParamsType,
      _signal: AbortSignal | undefined,
      onUpdate: AgentToolUpdateCallback<IssuesDetails> | undefined,
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
        content: [{ type: "text", text: `Running issues.${params.action}...` }],
        details: { action: params.action },
      });

      let result:
        | {
            issue?: SerializedIssue;
            children?: SerializedIssue[];
            error?: string;
          }
        | { issues?: SerializedIssue[]; totalCount?: number; error?: string };

      switch (params.action) {
        case "show": {
          const showResult = await showIssue(
            client,
            params as unknown as ShowIssueParams,
          );
          result = {
            issue: showResult.issue,
            children: showResult.children,
            error: showResult.error,
          };
          break;
        }
        case "create":
          result = await createIssue(
            client,
            params as unknown as CreateIssueParams,
          );
          break;
        case "list": {
          const listParams = params as unknown as ListIssuesParams;
          result = await listIssues(client, {
            ...listParams,
            includeCompleted: listParams.includeCompleted ?? false,
            includeCanceled: listParams.includeCanceled ?? false,
            includeSubIssues: listParams.includeSubIssues ?? false,
          });
          break;
        }
        case "search":
          result = await searchIssues(
            client,
            params as unknown as SearchIssuesParams,
          );
          break;
        case "update":
          result = await updateIssue(
            client,
            params as unknown as UpdateIssueParams,
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

      if ("issues" in result && result.issues) {
        return {
          content: [
            {
              type: "text",
              text: formatIssueListContent(
                result.issues,
                params.action,
                result.totalCount,
              ),
            },
          ],
          details: {
            action: params.action,
            issues: result.issues,
            totalCount: result.totalCount,
          },
        };
      }

      const issue = (
        "issue" in result ? result.issue : undefined
      ) as SerializedIssue;
      const children = ("children" in result ? result.children : undefined) as
        | SerializedIssue[]
        | undefined;
      const verb =
        params.action === "create"
          ? "Created"
          : params.action === "update"
            ? "Updated"
            : "Found";
      const summary = [
        `${verb} issue ${issue.identifier}: ${issue.title}`,
        `Status: ${issue.state} | Priority: ${issue.priorityLabel} | Team: ${issue.team}`,
      ];
      if (issue.project) summary.push(`Project: ${issue.project}`);
      if (issue.assignee) summary.push(`Assignee: ${issue.assignee}`);
      summary.push(`URL: ${issue.url}`);
      if (issue.description) summary.push(`\n${issue.description}`);
      if (children && children.length > 0) {
        summary.push(`\nSub-issues (${children.length}):`);
        for (const child of children) {
          summary.push(
            `  ${child.identifier}: ${child.title} | ${child.state} | ${child.priorityLabel}`,
          );
        }
      }
      return {
        content: [{ type: "text", text: summary.join("\n") }],
        details: { action: params.action, issue, children },
      };
    },

    renderCall(args: IssuesParamsType, theme: Theme) {
      const action = String(args.action ?? "");
      switch (action) {
        case "show":
          return new ToolCallHeader(
            {
              toolName: "Linear Issues",
              action: "Show",
              mainArg: String(args.id ?? ""),
            },
            theme,
          );
        case "create":
          return new ToolCallHeader(
            {
              toolName: "Linear Issues",
              action: "Create",
              mainArg: String(args.title ?? ""),
            },
            theme,
          );
        case "list":
          return new ToolCallHeader(
            { toolName: "Linear Issues", action: "List" },
            theme,
          );
        case "search":
          return new ToolCallHeader(
            {
              toolName: "Linear Issues",
              action: "Search",
              mainArg: String(args.query ?? ""),
            },
            theme,
          );
        case "update":
          return new ToolCallHeader(
            {
              toolName: "Linear Issues",
              action: "Update",
              mainArg: String(args.id ?? ""),
            },
            theme,
          );
        default:
          return new ToolCallHeader(
            { toolName: "Linear Issues", action },
            theme,
          );
      }
    },

    renderResult(
      result: AgentToolResult<IssuesDetails>,
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

      if (details.issues) {
        const fields: Array<
          | { label: string; value: string; showCollapsed?: boolean }
          | (Component & { showCollapsed?: boolean })
        > = [];

        if (options.expanded) {
          details.issues.forEach((issue, index) => {
            if (index > 0) fields.push(new Spacer(1));
            fields.push(renderIssueListItem(issue, theme));
          });
        } else {
          const summaryLabel = `${details.issues.length} issue${details.issues.length === 1 ? "" : "s"}`;
          const summaryText = new Text(
            theme.fg("accent", theme.bold(summaryLabel)),
            0,
            0,
          );
          Object.assign(summaryText, { showCollapsed: true });
          fields.push(summaryText);

          const collapsedSlice = details.issues.slice(0, COLLAPSED_MAX);
          for (const issue of collapsedSlice) {
            const line = renderIssueOneLiner(issue, theme);
            Object.assign(line, { showCollapsed: true });
            fields.push(line);
          }
          if (details.issues.length > COLLAPSED_MAX) {
            const more = new Text(
              theme.fg(
                "dim",
                `+ ${details.issues.length - COLLAPSED_MAX} more`,
              ),
              0,
              0,
            );
            Object.assign(more, { showCollapsed: true });
            fields.push(more);
          }
        }

        const footerItems = [];
        if (options.expanded) {
          if (
            details.action === "search" &&
            typeof details.totalCount === "number"
          ) {
            footerItems.push({
              value: `${details.totalCount} matches`,
              tone: "accent" as const,
            });
          }
          footerItems.push({
            value: `${details.issues.length} issue${details.issues.length === 1 ? "" : "s"}`,
            tone: "muted" as const,
          });
        }

        return new ToolBody(
          {
            fields,
            footer:
              footerItems.length > 0
                ? new ToolFooter(theme, { items: footerItems })
                : undefined,
            includeSpacerBeforeFooter: fields.length > 0,
          },
          options,
          theme,
        );
      }

      const issue = details.issue;
      if (!issue) {
        return new Text(theme.fg("warning", "No issue returned"), 0, 0);
      }

      const titleText = new Text(
        `${theme.fg("accent", theme.bold(issue.identifier))} ${issue.title}`,
        0,
        0,
      );
      Object.assign(titleText, { showCollapsed: true });

      const fields: Array<
        | { label: string; value: string; showCollapsed?: boolean }
        | (Component & { showCollapsed?: boolean })
      > = [titleText];

      if (options.expanded) {
        for (const component of renderIssueExpanded(issue, theme)) {
          fields.push(component);
        }
        if (details.children && details.children.length > 0) {
          fields.push(...renderIssueChildren(details.children, theme));
        }
      }

      return new ToolBody(
        {
          fields,
          footer: new ToolFooter(theme, {
            items: [
              { label: "Status", value: issue.state, tone: "accent" },
              { label: "Priority", value: issue.priorityLabel, tone: "muted" },
            ],
          }),
        },
        options,
        theme,
      );
    },
  });
}
