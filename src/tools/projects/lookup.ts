import type { LinearClient, Project, ProjectMilestone } from "@linear/sdk";

export async function resolveProject(
  client: LinearClient,
  projectId?: string,
  projectName?: string,
): Promise<Project | undefined> {
  if (projectId) {
    return client.project(projectId);
  }

  if (!projectName) return undefined;

  const projects = await client.projects({
    first: 50,
    filter: { name: { eq: projectName } },
  });

  return projects.nodes[0];
}

export async function resolveProjectId(
  client: LinearClient,
  projectId?: string,
  projectName?: string,
): Promise<string | undefined> {
  const project = await resolveProject(client, projectId, projectName);
  return project?.id;
}

export async function resolveProjectMilestone(
  client: LinearClient,
  options: {
    projectId?: string;
    projectName?: string;
    milestoneId?: string;
    milestoneName?: string;
  },
): Promise<ProjectMilestone | undefined> {
  if (options.milestoneId) {
    return client.projectMilestone(options.milestoneId);
  }

  if (!options.milestoneName) return undefined;

  const project = await resolveProject(
    client,
    options.projectId,
    options.projectName,
  );
  if (!project) return undefined;

  const milestones = await project.projectMilestones({
    first: 100,
    includeArchived: false,
    filter: { name: { eq: options.milestoneName } },
  });

  return milestones.nodes[0];
}

export async function resolveProjectMilestoneId(
  client: LinearClient,
  options: {
    projectId?: string;
    projectName?: string;
    milestoneId?: string;
    milestoneName?: string;
  },
): Promise<string | undefined> {
  const milestone = await resolveProjectMilestone(client, options);
  return milestone?.id;
}
