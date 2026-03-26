import type { LinearClient } from "@linear/sdk";
import { serializeIssue } from "../serialize";
import type { SerializedIssue } from "../types";

export interface SearchIssuesParams {
  query?: string;
  limit?: number;
  includeArchived?: boolean;
  stateId?: string;
  stateName?: string;
  assigneeId?: string;
  assigneeName?: string;
  projectId?: string;
  projectName?: string;
  teamId?: string;
  teamKey?: string;
  teamName?: string;
  labelId?: string;
  labelName?: string;
}

export interface SearchIssuesResult {
  issues?: SerializedIssue[];
  totalCount?: number;
  error?: string;
}

function buildIssueFilter(
  params: SearchIssuesParams,
): Record<string, unknown> | undefined {
  const filter: Record<string, unknown> = {};

  if (params.stateId || params.stateName) {
    filter.state = params.stateId
      ? { id: { eq: params.stateId } }
      : { name: { eq: params.stateName } };
  }

  if (params.assigneeId || params.assigneeName) {
    filter.assignee = params.assigneeId
      ? { id: { eq: params.assigneeId } }
      : { displayName: { eq: params.assigneeName } };
  }

  if (params.projectId || params.projectName) {
    filter.project = params.projectId
      ? { id: { eq: params.projectId } }
      : { name: { eq: params.projectName } };
  }

  if (params.teamId || params.teamKey || params.teamName) {
    filter.team = params.teamId
      ? { id: { eq: params.teamId } }
      : params.teamKey
        ? { key: { eq: params.teamKey } }
        : { name: { eq: params.teamName } };
  }

  if (params.labelId || params.labelName) {
    filter.labels = params.labelId
      ? { some: { id: { eq: params.labelId } } }
      : { some: { name: { eq: params.labelName } } };
  }

  return Object.keys(filter).length > 0 ? filter : undefined;
}

export async function searchIssues(
  client: LinearClient,
  params: SearchIssuesParams,
): Promise<SearchIssuesResult> {
  if (!params.query) {
    return { error: "query is required to search issues." };
  }

  try {
    const results = await client.searchIssues(params.query, {
      first: params.limit ?? 10,
      includeArchived: params.includeArchived ?? false,
      filter: buildIssueFilter(params) as never,
      teamId: params.teamId,
    });

    const issues = await Promise.all(
      results.nodes.map(async (result) =>
        serializeIssue(await client.issue(result.id)),
      ),
    );

    return {
      issues,
      totalCount: results.totalCount,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
