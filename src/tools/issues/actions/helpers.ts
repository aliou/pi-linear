import type { LinearClient } from "@linear/sdk";
import {
  resolveProjectId,
  resolveProjectMilestoneId,
} from "../../projects/lookup";

export async function resolveIssueProjectMilestoneId(
  client: LinearClient,
  options: {
    projectId?: string;
    projectName?: string;
    projectMilestoneId?: string;
    projectMilestoneName?: string;
  },
): Promise<{ milestoneId?: string; error?: string }> {
  if (options.projectMilestoneId) {
    return { milestoneId: options.projectMilestoneId };
  }

  if (!options.projectMilestoneName) {
    return {};
  }

  const projectId = await resolveProjectId(
    client,
    options.projectId,
    options.projectName,
  );
  if (!projectId) {
    return {
      error:
        "projectId or projectName is required when using projectMilestoneName.",
    };
  }

  const milestoneId = await resolveProjectMilestoneId(client, {
    projectId,
    milestoneName: options.projectMilestoneName,
  });
  if (!milestoneId) {
    return {
      error: `Could not find project milestone "${options.projectMilestoneName}".`,
    };
  }

  return { milestoneId };
}
