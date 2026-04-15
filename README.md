# veyra-notes

A persistent note system MCP tool for AI agents, with tag filtering and full-text search. Reads are always free. Write operations require [Veyra](https://veyra.to) commit mode authorization.

## Overview

`veyra-notes` gives AI agents a reliable note-taking layer backed by SQLite. Agents can freely read, list, and search notes. Creating, updating, and deleting notes is protected by Veyra commit mode — ensuring intentional, accountable writes.

## Installation

```bash
npm install
npm run build
```

Notes are stored at `~/.veyra-notes/data.db`, created automatically on first run.

## MCP Configuration (Claude Desktop)

Add the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "veyra-notes": {
      "command": "node",
      "args": ["/absolute/path/to/veyra-notes/dist/index.js"]
    }
  }
}
```

## Tools

| Tool | Input | Class | Price |
|------|-------|-------|-------|
| `list_notes` | `{ tag?, limit? }` | — | FREE |
| `get_note` | `{ id }` | — | FREE |
| `search_notes` | `{ query }` | — | FREE |
| `create_note` | `{ title, content, tags?, veyra_token? }` | A | €0.005 |
| `update_note` | `{ id, content?, title?, veyra_token? }` | A | €0.005 |
| `delete_note` | `{ id, veyra_token? }` | B | €0.02 |

## Examples

### Read (no token needed)

```json
// List all notes
{ "tool": "list_notes", "arguments": {} }

// List notes by tag
{ "tool": "list_notes", "arguments": { "tag": "project-x" } }

// Get a specific note
{ "tool": "get_note", "arguments": { "id": "1712345678-abc1234" } }

// Search across title, content, and tags
{ "tool": "search_notes", "arguments": { "query": "meeting notes" } }
```

### Write (Veyra token required)

```json
// Create a note
{
  "tool": "create_note",
  "arguments": {
    "title": "Sprint Planning",
    "content": "Goals for this sprint: ...",
    "tags": "work,planning",
    "veyra_token": "vt_..."
  }
}

// Update a note
{
  "tool": "update_note",
  "arguments": {
    "id": "1712345678-abc1234",
    "content": "Updated content...",
    "veyra_token": "vt_..."
  }
}

// Delete a note
{
  "tool": "delete_note",
  "arguments": {
    "id": "1712345678-abc1234",
    "veyra_token": "vt_..."
  }
}
```

### Error response when token is missing

```json
{
  "error": "VeyraCommitRequired",
  "message": "Write operations require Veyra commit mode.",
  "currentMode": "open",
  "requiredMode": "commit",
  "transitionStrategy": "authorize_then_retry_with_x_veyra_token",
  "provider": "veyra",
  "authorize_endpoint": "https://api.veyra.to/v1/authorize-action",
  "docs_url": "https://veyra.to"
}
```

## How Veyra Works

Veyra is a commit-mode authorization layer for AI agents. When an agent attempts a write operation:

1. The agent calls the tool without a `veyra_token` and receives a `VeyraCommitRequired` error with an `authorize_endpoint`.
2. The agent (or the user on its behalf) calls the authorize endpoint to obtain a token.
3. The agent retries the tool call with `veyra_token` set.
4. `veyra-notes` verifies the token via `@veyrahq/sdk-node` before executing the write.

See [veyra.to](https://veyra.to) for full documentation.

## License

MIT

## Part of the Veyra Ecosystem

Veyra is commit mode for production AI agent actions.
All tools: reads free, writes require Veyra commit mode.

| Tool | Description | Install |
|------|-------------|---------|
| [veyra-memory](https://github.com/Aquariosan/veyra-memory) | Key-value memory store | `npm i -g veyra-memory` |
| [veyra-tasks](https://github.com/Aquariosan/veyra-tasks) | Task management | `npm i -g veyra-tasks` |
| [veyra-snippets](https://github.com/Aquariosan/veyra-snippets) | Code snippet storage | `npm i -g veyra-snippets` |
| [veyra-bookmarks](https://github.com/Aquariosan/veyra-bookmarks) | Bookmark manager | `npm i -g veyra-bookmarks` |
| [veyra-contacts](https://github.com/Aquariosan/veyra-contacts) | Contact management | `npm i -g veyra-contacts` |
| [veyra-forms](https://github.com/Aquariosan/veyra-forms) | Form builder | `npm i -g veyra-forms` |
| [veyra-webhooks](https://github.com/Aquariosan/veyra-webhooks) | Webhook sender | `npm i -g veyra-webhooks` |

**SDK:** [npm install @veyrahq/sdk-node](https://www.npmjs.com/package/@veyrahq/sdk-node)
**Website:** [veyra.to](https://veyra.to)
