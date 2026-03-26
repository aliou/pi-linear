---
"@aliou/pi-linear": minor
---

Added a new `linear_issue_start` tool to kick off implementation from a Linear issue.

Highlights:
- Optional issue status transition to started state (`In Progress` with `Started` fallback)
- Optional local git branch creation using Linear suggested `branchName` when available
- Dirty working tree safety check that requires explicit confirmation to continue
- Warning when creating a branch from a non-default base branch

Added new settings under a dedicated **Issue Start** section:
- `startUpdateState`: `ask` | `true` | `false` (default `ask`)
- `startCreateBranch`: `ask` | `true` | `false` (default `ask`)
