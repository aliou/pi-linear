import type { LinearClient } from "@linear/sdk";
import { resolveTeamId } from "../../../teams";
import { resolveProjectId } from "../../projects/lookup";
import { serializeIssue } from "../serialize";
import type { SerializedIssue } from "../types";
import { resolveIssueProjectMilestoneId } from "./helpers";

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
  projectName?: string;
  projectMilestoneId?: string;
  projectMilestoneName?: string;
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

  try {
    const teamId = await resolveTeamId(
      client,
      params.teamId,
      params.teamKey,
      params.teamName,
    );
    if (!teamId) {
      const identifier = params.teamKey ?? params.teamName ?? params.teamId;
      return {
        error: identifier
          ? `Could not find team "${identifier}". Verify the team key or name.`
          : "No team resolved. Provide teamId/teamKey/teamName or set defaultTeamKey in /linear:auth or /linear:settings.",
      };
    }

    const resolvedProjectId = await resolveProjectId(
      client,
      params.projectId,
      params.projectName,
    );
    const { milestoneId, error } = await resolveIssueProjectMilestoneId(
      client,
      {
        projectId: resolvedProjectId,
        projectName: params.projectName,
        projectMilestoneId: params.projectMilestoneId,
        projectMilestoneName: params.projectMilestoneName,
      },
    );
    if (error) return { error };

    const payload = await client.createIssue({
      teamId,
      title: params.title,
      description: params.description,
      assigneeId: params.assigneeId,
      priority: params.priority,
      stateId: params.stateId,
      projectId: resolvedProjectId,
      projectMilestoneId: milestoneId,
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
