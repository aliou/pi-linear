import type { LinearClient } from "@linear/sdk";
import { resolveProjectId } from "../../projects/lookup";
import { serializeIssue } from "../serialize";
import type { SerializedIssue } from "../types";
import { resolveIssueProjectMilestoneId } from "./helpers";

export interface UpdateIssueParams {
  id?: string;
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
  teamId?: string;
}

export interface UpdateIssueResult {
  issue?: SerializedIssue;
  error?: string;
}

export async function updateIssue(
  client: LinearClient,
  params: UpdateIssueParams,
): Promise<UpdateIssueResult> {
  if (!params.id) {
    return { error: "id is required to update an issue." };
  }

  try {
    const resolvedProjectId =
      params.projectId || params.projectName
        ? await resolveProjectId(client, params.projectId, params.projectName)
        : undefined;
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

    const payload = await client.updateIssue(params.id, {
      title: params.title,
      description: params.description,
      assigneeId: params.assigneeId,
      priority: params.priority,
      stateId: params.stateId,
      projectId: resolvedProjectId ?? params.projectId,
      projectMilestoneId: milestoneId,
      labelIds: params.labelIds,
      dueDate: params.dueDate,
      estimate: params.estimate,
      parentId: params.parentId,
      teamId: params.teamId,
    });

    const issue = await payload.issue;
    if (!issue) {
      return { error: "Issue updated but could not be fetched." };
    }

    return { issue: await serializeIssue(issue) };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
