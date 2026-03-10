/**
 * System prompt guidance for agents using this extension.
 * Injected into the system prompt via hooks.
 */
export const guidance = `
# Linear

This extension provides tools to interact with Linear issues and projects.

## Available Tools

- linear_issues: Manage issues with actions show, create, list, search, and update
- linear_projects: Manage projects with actions show, create, list, and update
- linear_teams: List teams in the workspace

## Usage Guidelines

- Use issue identifiers like ENG-123 when you have them.
- Prefer scoped list/search requests by team, state, assignee, project, or label.
- For updates, pass only the fields that should change.
- For projects, prefer status, lead, and team filters when listing.
`;
