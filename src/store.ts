import Database from "better-sqlite3";
import { existsSync, mkdirSync } from "fs";
import { homedir } from "os";
import { join } from "path";

const DB_DIR = join(homedir(), ".veyra-notes");
const DB_PATH = join(DB_DIR, "data.db");

if (!existsSync(DB_DIR)) {
  mkdirSync(DB_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS notes (
    id         TEXT PRIMARY KEY,
    title      TEXT NOT NULL,
    content    TEXT NOT NULL,
    tags       TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`);

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string | null;
  created_at: string;
  updated_at: string;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function list(tag?: string, limit = 100): Note[] {
  if (tag) {
    const stmt = db.prepare(
      "SELECT * FROM notes WHERE tags LIKE ? ORDER BY updated_at DESC LIMIT ?"
    );
    return stmt.all(`%${tag}%`, limit) as Note[];
  }
  const stmt = db.prepare(
    "SELECT * FROM notes ORDER BY updated_at DESC LIMIT ?"
  );
  return stmt.all(limit) as Note[];
}

export function get(id: string): Note | undefined {
  const stmt = db.prepare("SELECT * FROM notes WHERE id = ?");
  return stmt.get(id) as Note | undefined;
}

export function search(query: string, limit = 50): Note[] {
  const stmt = db.prepare(
    "SELECT * FROM notes WHERE title LIKE ? OR content LIKE ? OR tags LIKE ? ORDER BY updated_at DESC LIMIT ?"
  );
  const pattern = `%${query}%`;
  return stmt.all(pattern, pattern, pattern, limit) as Note[];
}

export function create(
  title: string,
  content: string,
  tags?: string
): Note {
  const now = new Date().toISOString();
  const id = generateId();
  const stmt = db.prepare(
    "INSERT INTO notes (id, title, content, tags, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
  );
  stmt.run(id, title, content, tags ?? null, now, now);
  return get(id)!;
}

export function update(
  id: string,
  fields: { title?: string; content?: string }
): Note | undefined {
  const existing = get(id);
  if (!existing) return undefined;
  const now = new Date().toISOString();
  const title = fields.title ?? existing.title;
  const content = fields.content ?? existing.content;
  const stmt = db.prepare(
    "UPDATE notes SET title = ?, content = ?, updated_at = ? WHERE id = ?"
  );
  stmt.run(title, content, now, id);
  return get(id)!;
}

export function del(id: string): boolean {
  const stmt = db.prepare("DELETE FROM notes WHERE id = ?");
  const result = stmt.run(id);
  return result.changes > 0;
}
