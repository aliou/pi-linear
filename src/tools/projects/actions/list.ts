import type { LinearClient } from "@linear/sdk";
import { serializeProject } from "../serialize";
import type { SerializedProject } from "../types";

export interface ListProjectsParams {
  limit?: number;
  includeArchived?: boolean;
  statusId?: string;
  statusName?: string;
  leadId?: string;
  leadName?: string;
  teamId?: string;
  teamKey?: string;
  teamName?: string;
}

export interface ListProjectsResult {
  projects?: SerializedProject[];
  error?: string;
}

function buildProjectFilter(
  params: ListProjectsParams,
): Record<string, unknown> | undefined {
  const filter: Record<string, unknown> = {};

  if (params.statusId || params.statusName) {
    filter.status = params.statusId
      ? { id: { eq: params.statusId } }
      : { name: { eq: params.statusName } };
  }

  if (params.leadId || params.leadName) {
    filter.lead = params.leadId
      ? { id: { eq: params.leadId } }
      : { displayName: { eq: params.leadName } };
  }

  if (params.teamId || params.teamKey || params.teamName) {
    filter.accessibleTeams = params.teamId
      ? { some: { id: { eq: params.teamId } } }
      : params.teamKey
        ? { some: { key: { eq: params.teamKey } } }
        : { some: { name: { eq: params.teamName } } };
  }

  return Object.keys(filter).length > 0 ? filter : undefined;
}

export async function listProjects(
  client: LinearClient,
  params: ListProjectsParams,
): Promise<ListProjectsResult> {
  try {
    const projects = await client.projects({
      first: params.limit ?? 10,
      includeArchived: params.includeArchived,
      filter: buildProjectFilter(params) as never,
    });

    return {
      projects: await Promise.all(
        projects.nodes.map((project) => serializeProject(project)),
      ),
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
