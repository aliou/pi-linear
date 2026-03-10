import type { LinearClient } from "@linear/sdk";
import { resolveTeamId } from "../../../teams";
import { serializeIssue } from "../serialize";
import type { SerializedIssue } from "../types";

export interface CreateIssueParams {
  teamId?: string;
  teamKey?: string;
  teamName?: string;
  title?: string;
  description?: string;
  assigneeId?: string;
  priority?: number;
  stateId?: string;
  projectId?: string;
  labelIds?: string[];
  dueDate?: string;
  estimate?: number;
  parentId?: string;
}

export interface CreateIssueResult {
  issue?: SerializedIssue;
  error?: string;
}

export async function createIssue(
  client: LinearClient,
  params: CreateIssueParams,
): Promise<CreateIssueResult> {
  if (!params.title) {
    return { error: "title is required to create an issue." };
  }

  if (!params.teamId && !params.teamKey && !params.teamName) {
    return {
      error:
        "A team is required to create an issue. Provide teamId, teamKey, or teamName.",
    };
  }

  try {
    const teamId = await resolveTeamId(
      client,
      params.teamId,
      params.teamKey,
      params.teamName,
    );
    if (!teamId) {
      const identifier = params.teamKey ?? params.teamName;
      return {
        error: `Could not find team "${identifier}". Verify the team key or name.`,
      };
    }

    const payload = await client.createIssue({
      teamId,
      title: params.title,
      description: params.description,
      assigneeId: params.assigneeId,
      priority: params.priority,
      stateId: params.stateId,
      projectId: params.projectId,
      labelIds: params.labelIds,
      dueDate: params.dueDate,
      estimate: params.estimate,
      parentId: params.parentId,
    });

    const issue = await payload.issue;
    if (!issue) {
      return { error: "Issue created but could not be fetched." };
    }

    return { issue: await serializeIssue(issue) };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
