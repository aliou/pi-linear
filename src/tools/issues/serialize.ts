import type { Issue } from "@linear/sdk";
import type { SerializedIssue } from "./types";

/** Resolve lazy SDK refs on an Issue into a plain object. */
export async function serializeIssue(issue: Issue): Promise<SerializedIssue> {
  const [state, assignee, project, team, labels] = await Promise.all([
    issue.state,
    issue.assignee,
    issue.project,
    issue.team,
    issue.labels(),
  ]);

  return {
    id: issue.id,
    identifier: issue.identifier,
    title: issue.title,
    description: issue.description ?? undefined,
    state: state?.name ?? "Unknown",
    assignee: assignee?.displayName,
    priority: issue.priority,
    priorityLabel: issue.priorityLabel,
    url: issue.url,
    createdAt: issue.createdAt.toISOString(),
    updatedAt: issue.updatedAt.toISOString(),
    dueDate: issue.dueDate ?? undefined,
    estimate: issue.estimate ?? undefined,
    labels: labels.nodes.map((l) => l.name),
    project: project?.name,
    team: team?.name ?? "Unknown",
    parentId: issue.parentId ?? undefined,
  };
}
