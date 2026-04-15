#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as store from "./store.js";
import { requireVeyra } from "./veyra.js";

const server = new Server(
  { name: "veyra-notes", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "list_notes",
      description: "List all notes, optionally filtered by tag. FREE — no token required.",
      inputSchema: {
        type: "object",
        properties: {
          tag: { type: "string", description: "Filter by tag" },
          limit: { type: "number", description: "Max notes to return (default 100)" },
        },
      },
    },
    {
      name: "get_note",
      description: "Retrieve a note by ID. FREE — no token required.",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "The note ID" },
        },
        required: ["id"],
      },
    },
    {
      name: "search_notes",
      description: "Search notes by query (matches title, content, tags). FREE — no token required.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search term" },
        },
        required: ["query"],
      },
    },
    {
      name: "create_note",
      description: "Create a new note. Requires Veyra commit mode (Class A — €0.005).",
      inputSchema: {
        type: "object",
        properties: {
          title: { type: "string", description: "Note title" },
          content: { type: "string", description: "Note content" },
          tags: { type: "string", description: "Optional comma-separated tags" },
          veyra_token: { type: "string", description: "Veyra authorization token" },
        },
        required: ["title", "content"],
      },
    },
    {
      name: "update_note",
      description: "Update an existing note's title or content. Requires Veyra commit mode (Class A — €0.005).",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "The note ID to update" },
          title: { type: "string", description: "New title" },
          content: { type: "string", description: "New content" },
          veyra_token: { type: "string", description: "Veyra authorization token" },
        },
        required: ["id"],
      },
    },
    {
      name: "delete_note",
      description: "Delete a note by ID. Requires Veyra commit mode (Class B — €0.02).",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "The note ID to delete" },
          veyra_token: { type: "string", description: "Veyra authorization token" },
        },
        required: ["id"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "list_notes": {
      const { tag, limit } = args as { tag?: string; limit?: number };
      const notes = store.list(tag, limit);
      return {
        content: [{ type: "text", text: JSON.stringify({ count: notes.length, notes }) }],
      };
    }

    case "get_note": {
      const { id } = args as { id: string };
      const note = store.get(id);
      if (!note) {
        return {
          content: [{ type: "text", text: JSON.stringify({ found: false, id }) }],
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify({ found: true, ...note }) }],
      };
    }

    case "search_notes": {
      const { query } = args as { query: string };
      const notes = store.search(query);
      return {
        content: [{ type: "text", text: JSON.stringify({ count: notes.length, query, notes }) }],
      };
    }

    case "create_note": {
      const { title, content, tags, veyra_token } = args as {
        title: string;
        content: string;
        tags?: string;
        veyra_token?: string;
      };
      const check = await requireVeyra(veyra_token);
      if (!check.ok) {
        return { content: [{ type: "text", text: JSON.stringify(check.error, null, 2) }] };
      }
      const note = store.create(title, content, tags);
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, commit_mode: "verified", ...note }) }],
      };
    }

    case "update_note": {
      const { id, title, content, veyra_token } = args as {
        id: string;
        title?: string;
        content?: string;
        veyra_token?: string;
      };
      const check = await requireVeyra(veyra_token);
      if (!check.ok) {
        return { content: [{ type: "text", text: JSON.stringify(check.error, null, 2) }] };
      }
      const note = store.update(id, { title, content });
      if (!note) {
        return {
          content: [{ type: "text", text: JSON.stringify({ success: false, error: "NoteNotFound", id }) }],
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, commit_mode: "verified", ...note }) }],
      };
    }

    case "delete_note": {
      const { id, veyra_token } = args as { id: string; veyra_token?: string };
      const check = await requireVeyra(veyra_token);
      if (!check.ok) {
        return { content: [{ type: "text", text: JSON.stringify(check.error, null, 2) }] };
      }
      const deleted = store.del(id);
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, id, deleted, commit_mode: "verified" }) }],
      };
    }

    default:
      return {
        content: [{ type: "text", text: JSON.stringify({ error: "UnknownTool", tool: name }) }],
      };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("veyra-notes server error:", err);
  process.exit(1);
});
