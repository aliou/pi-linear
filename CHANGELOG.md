# @aliou/pi-extension-template

## 0.1.0

### Minor Changes

- 7302e06: Added a new `linear_issue_start` tool to kick off implementation from a Linear issue.

  Highlights:

  - Optional issue status transition to started state (`In Progress` with `Started` fallback)
  - Optional local git branch creation using Linear suggested `branchName` when available
  - Dirty working tree safety check that requires explicit confirmation to continue
  - Warning when creating a branch from a non-default base branch

  Added new settings under a dedicated **Issue Start** section:

  - `startUpdateState`: `ask` | `true` | `false` (default `ask`)
  - `startCreateBranch`: `ask` | `true` | `false` (default `ask`)

- 7007f7a: Added new interactive commands for starting and browsing work in Linear:

  - `/linear:start [ISSUE_ID]`

    - Starts work from a Linear issue.
    - If no issue id is provided, opens an issue picker.
    - On success, posts issue context (including parent issue context when present) as a follow-up user message.

  - `/linear:browse`
    - Opens a tabbed browser for issues, projects, and milestones.
    - Loads panel immediately and fetches tab data lazily.
    - Keeps list height fixed to avoid layout jump when item counts change.

### Patch Changes

- e4832d7: Default list/search calls now exclude archived entities unless explicitly requested by setting `includeArchived: true`.

  Issue listing behavior for `includeSubIssues: false` is fixed to return parent issues only instead of an empty result set in affected workspaces.

- f414fd5: Return structured JSON output from project, document, and milestone show/create/update actions instead of minimal text. External links and documents are now exposed to agents in the text output.
- ca485f9: Remove Linear's legacy system-prompt guidance hook now that tool guidance lives with the tools.
- c7cdd60: `linear_issues` now includes Linear's suggested branch name (`branchName`) in serialized issue output.

  `show` results include the suggested branch in both text and expanded rendered views when available.

- 40a4faf: Display delegated Linear agents in issue assignee output as `AgentName (via Username)` so issue views reflect agent-driven work more clearly.
- 549eda0: Update Pi dependencies to 0.61.0. Custom tools now declare `promptSnippet` so they remain visible in Pi's default tool prompt, and action enums use `StringEnum` for better provider compatibility.

## 0.0.1

### Patch Changes

- Initial release
