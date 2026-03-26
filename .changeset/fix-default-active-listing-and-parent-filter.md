---
"@aliou/pi-linear": patch
---

Default list/search calls now exclude archived entities unless explicitly requested by setting `includeArchived: true`.

Issue listing behavior for `includeSubIssues: false` is fixed to return parent issues only instead of an empty result set in affected workspaces.
