# @aliou/pi-linear

Pi extension for interacting with [Linear](https://linear.app) via the Linear SDK.

## Installation

```
pi install @aliou/pi-linear
```

## Configuration

The extension requires a Linear API key. Get one at https://linear.app/settings/api.

### Option 1: Settings command (recommended)

Run `/linear:settings` in pi to configure the API key interactively.

### Option 2: Environment variable

```bash
export LINEAR_API_KEY=lin_api_...
```

If no key is found, the extension disables its tools and shows a warning at session start.

## Commands

| Command | Description |
|---|---|
| `/linear:settings` | Configure the extension (API key, enable/disable) |

## Settings

| Field | Type | Default | Description |
|---|---|---|---|
| `enabled` | `boolean` | `true` | Enable or disable the extension |
| `apiKey` | `string` | — | Linear API key (falls back to `LINEAR_API_KEY` env var) |

## Tools

### `linear_issues`

Manage Linear issues.

| Action | Description |
|---|---|
| `list` | List issues, with optional filters (team, project, state, assignee, label) |
| `search` | Full-text search across issues |
| `show` | Show a single issue by ID or identifier (e.g. `ENG-123`), including sub-issues |
| `create` | Create a new issue in a team |
| `update` | Update an existing issue (state, assignee, priority, labels, etc.) |

### `linear_projects`

Manage Linear projects.

| Action | Description |
|---|---|
| `list` | List projects, with optional filters (team, status, lead) |
| `show` | Show a single project by ID |
| `create` | Create a new project |
| `update` | Update an existing project (status, lead, dates, priority, etc.) |

### `linear_teams`

| Action | Description |
|---|---|
| `list` | List all active teams in the workspace |
