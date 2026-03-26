---
"@aliou/pi-linear": minor
---

Added new interactive commands for starting and browsing work in Linear:

- `/linear:start [ISSUE_ID]`
  - Starts work from a Linear issue.
  - If no issue id is provided, opens an issue picker.
  - On success, posts issue context (including parent issue context when present) as a follow-up user message.

- `/linear:browse`
  - Opens a tabbed browser for issues, projects, and milestones.
  - Loads panel immediately and fetches tab data lazily.
  - Keeps list height fixed to avoid layout jump when item counts change.
