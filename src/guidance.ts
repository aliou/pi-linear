/**
 * System prompt guidance for agents using this extension.
 * Injected into the system prompt via hooks.
 */
export const guidance = `
# Linear

This extension provides tools to interact with Linear issues, projects, milestones, documents, teams, and team states.

## Available Tools

- linear_issues: Manage issues, comments, attachments, issue relations, and linked issue documents
- linear_projects: Manage projects and project relations
- linear_project_milestones: Manage project milestones
- linear_documents: Manage Linear documents
- linear_teams: List teams in the workspace
- linear_team_states: List team workflow states
## Usage Guidelines

- Use issue identifiers like ENG-123 when you have them.
- Prefer scoped list/search requests by team, state, assignee, project, or label.
- For updates, pass only the fields that should change.
- For projects, prefer status, lead, and team filters when listing.
- Use linear_project_milestones for milestone CRUD and issue milestone assignment by ID or name when working with project planning.
`;
