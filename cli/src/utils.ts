/**
 * Shared utilities: minimal YAML parser, sha256, .ddd path resolution, ID generation.
 *
 * The YAML parser intentionally supports only the subset used by DDD artifacts:
 * block mappings, block sequences, flow sequences ([a, b]), quoted/plain scalars,
 * null/boolean/number scalars, and full-line or trailing comments. That covers
 * book.yaml, evidence.lock, claims.yaml, and trace-matrix.yaml.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

// ---------------------------------------------------------------------------
// Hashing
// ---------------------------------------------------------------------------

export function sha256Hex(content: string | Uint8Array): string {
  return createHash("sha256").update(content).digest("hex");
}

export function sha256Digest(content: string | Uint8Array): string {
  return `sha256:${sha256Hex(content)}`;
}

// ---------------------------------------------------------------------------
// Paths / time
// ---------------------------------------------------------------------------

/** Locate the `.ddd/` directory by walking upward from `start`. */
export function findDddDir(start: string = process.cwd()): string {
  let dir = resolve(start);
  for (;;) {
    const candidate = join(dir, ".ddd");
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) return join(resolve(start), ".ddd");
    dir = parent;
  }
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function readText(path: string): string {
  return readFileSync(path, "utf8");
}

export function writeText(path: string, text: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text, "utf8");
}

// ---------------------------------------------------------------------------
// ID generation
// ---------------------------------------------------------------------------

/** Generate the next sequential ID for a prefix, e.g. nextId(entries, "EL") -> "EL-003". */
export function nextId(items: Array<{ id?: string }>, prefix: string): string {
  let max = 0;
  const re = new RegExp(`^${prefix}-(\\d+)$`);
  for (const item of items) {
    const m = typeof item.id === "string" ? item.id.match(re) : null;
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}

// ---------------------------------------------------------------------------
// Minimal YAML parser
// ---------------------------------------------------------------------------

type Yaml = string | number | boolean | null | Yaml[] | { [key: string]: Yaml };

interface YamlLine {
  indent: number;
  content: string;
}

function stripComment(s: string): string {
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "'" && !inDouble) inSingle = !inSingle;
    else if (c === '"' && !inSingle) inDouble = !inDouble;
    else if (c === "#" && !inSingle && !inDouble && (i === 0 || s[i - 1] === " " || s[i - 1] === "\t")) {
      return s.slice(0, i).trimEnd();
    }
  }
  return s;
}

function unquote(s: string): string {
  if (s.length >= 2 && s.startsWith('"') && s.endsWith('"')) {
    return s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  }
  if (s.length >= 2 && s.startsWith("'") && s.endsWith("'")) {
    return s.slice(1, -1).replace(/''/g, "'");
  }
  return s;
}

function parseFlowSequence(s: string): Yaml[] {
  const inner = s.slice(1, -1).trim();
  if (!inner) return [];
  const parts: string[] = [];
  let current = "";
  let inSingle = false;
  let inDouble = false;
  for (const c of inner) {
    if (c === "'" && !inDouble) inSingle = !inSingle;
    else if (c === '"' && !inSingle) inDouble = !inDouble;
    if (c === "," && !inSingle && !inDouble) {
      parts.push(current);
      current = "";
    } else {
      current += c;
    }
  }
  parts.push(current);
  return parts.map((p) => parseScalar(p.trim()));
}

export function parseScalar(s: string): Yaml {
  const t = s.trim();
  if (t === "" || t === "null" || t === "~") return null;
  if (t === "true") return true;
  if (t === "false") return false;
  if (t.startsWith("[") && t.endsWith("]")) return parseFlowSequence(t);
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return unquote(t);
  }
  if (/^-?\d+$/.test(t)) return parseInt(t, 10);
  if (/^-?\d+\.\d+$/.test(t)) return parseFloat(t);
  return t;
}

/** Split "key: value" into [key, value]; value is "" when the line is "key:". */
function splitKeyValue(content: string): [string, string] {
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < content.length; i++) {
    const c = content[i];
    if (c === "'" && !inDouble) inSingle = !inSingle;
    else if (c === '"' && !inSingle) inDouble = !inDouble;
    else if (c === ":" && !inSingle && !inDouble) {
      if (i === content.length - 1 || content[i + 1] === " ") {
        return [unquote(content.slice(0, i).trim()), content.slice(i + 1).trim()];
      }
    }
  }
  throw new Error(`Invalid YAML mapping line: ${content}`);
}

function isKeyValue(content: string): boolean {
  try {
    splitKeyValue(content);
    return true;
  } catch {
    return false;
  }
}

/**
 * Parse a YAML document (DDD subset) into plain JS values.
 * Throws on structures outside the supported subset.
 */
export function parseYaml(text: string): Yaml {
  const lines: YamlLine[] = [];
  for (const raw of text.split("\n")) {
    if (!raw.trim()) continue;
    if (raw.trimStart().startsWith("#")) continue;
    if (raw.trimStart().startsWith("---")) continue;
    const indent = raw.length - raw.trimStart().length;
    lines.push({ indent, content: stripComment(raw.trim()) });
  }

  let pos = 0;

  function parseBlock(indent: number): Yaml {
    if (pos >= lines.length || lines[pos].indent < indent) return null;
    const first = lines[pos];
    if (first.content === "-" || first.content.startsWith("- ")) {
      return parseSequence(indent);
    }
    const map: Record<string, Yaml> = {};
    parseMappingInto(map, indent, null);
    return map;
  }

  function parseSequence(indent: number): Yaml[] {
    const arr: Yaml[] = [];
    while (
      pos < lines.length &&
      lines[pos].indent === indent &&
      (lines[pos].content === "-" || lines[pos].content.startsWith("- "))
    ) {
      const itemContent = lines[pos].content === "-" ? "" : lines[pos].content.slice(2);
      pos++;
      if (itemContent === "") {
        arr.push(pos < lines.length && lines[pos].indent > indent ? parseBlock(lines[pos].indent) : null);
      } else if (isKeyValue(itemContent)) {
        // Mapping item: first key inline, remaining keys at indent + 2.
        const map: Record<string, Yaml> = {};
        parseMappingInto(map, indent + 2, itemContent);
        arr.push(map);
      } else {
        arr.push(parseScalar(itemContent));
      }
    }
    return arr;
  }

  function parseMappingInto(map: Record<string, Yaml>, indent: number, firstLine: string | null): void {
    let pending = firstLine;
    for (;;) {
      let content: string;
      if (pending !== null) {
        content = pending;
        pending = null;
      } else {
        if (pos >= lines.length) break;
        if (lines[pos].indent !== indent) break;
        if (lines[pos].content === "-" || lines[pos].content.startsWith("- ")) break;
        content = lines[pos].content;
        pos++;
      }
      const [key, value] = splitKeyValue(content);
      if (value === "") {
        map[key] = pos < lines.length && lines[pos].indent > indent ? parseBlock(lines[pos].indent) : null;
      } else if (value === ">" || value === "|") {
        const blockLines: string[] = [];
        while (pos < lines.length && lines[pos].indent > indent) {
          blockLines.push(lines[pos].content);
          pos++;
        }
        map[key] = blockLines.join(value === ">" ? " " : "\n");
      } else {
        map[key] = parseScalar(value);
      }
    }
  }

  return lines.length === 0 ? {} : parseBlock(lines[0].indent);
}

// ---------------------------------------------------------------------------
// Minimal YAML serialization helpers (for appending entries)
// ---------------------------------------------------------------------------

/** Quote a scalar when it could be misparsed (contains ':', '#', leading/trailing space, etc.). */
export function yamlScalar(value: string | number | boolean | null): string {
  if (value === null) return "null";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  const s = String(value);
  if (
    s === "" ||
    /[:#\[\]{},&*!|>'"%@`]/.test(s) ||
    s !== s.trim() ||
    /^(null|~|true|false|-?\d+(\.\d+)?)$/i.test(s)
  ) {
    return `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  }
  return s;
}

export function yamlFlowList(items: string[]): string {
  return `[${items.map((i) => yamlScalar(i)).join(", ")}]`;
}

// ---------------------------------------------------------------------------
// Ledger loading with round-trip integrity guard
// ---------------------------------------------------------------------------

export interface LoadedLedger<T> {
  text: string;
  entries: T[];
}

/**
 * Load an append-style ledger (trace-matrix, validations, goals, exceptions,
 * obligations) for writing.
 *
 * Round-trip guard: the minimal YAML parser reads only the CLI's dialect
 * (sequence items indented deeper than their parent key, unfolded strings).
 * An external tool (e.g. pyyaml) that rewrites a ledger emits a dialect the
 * parser silently reads as a null list, which would make the next append
 * restart IDs and interleave formats. To make that failure loud, a raw line
 * scan of `- id:` items must agree with the parsed entry count; a null or
 * truncated list under a non-empty ledger is corruption, not emptiness.
 */
export function loadLedger<T extends { id?: string }>(
  path: string,
  header: string,
  key: string,
): LoadedLedger<T> {
  const text = existsSync(path) ? readText(path) : header;
  const doc = (parseYaml(text) as Record<string, unknown>) ?? {};
  const entries = Array.isArray(doc[key]) ? (doc[key] as T[]) : [];
  const rawItemCount = (text.match(/^[ \t]*-[ \t]+id:/gm) ?? []).length;
  if (rawItemCount !== entries.length) {
    throw new Error(
      `Ledger ${path} is corrupted: a raw scan finds ${rawItemCount} entries but the parser reads ${entries.length}. ` +
        `Likely cause: an external tool rewrote the file in a YAML dialect the CLI parser cannot read ` +
        `(sequence items at their parent key's indent, or folded strings), so the list reads as null. ` +
        `Rule: ledgers must stay in the CLI's YAML dialect; edit them only through ddd writer commands. ` +
        `Fix: restore the file from git history, or re-serialize it in the CLI dialect before appending.`,
    );
  }
  return { text, entries };
}

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

export interface ParsedArgs {
  positional: string[];
  flags: Record<string, string | boolean>;
}

export function parseArgs(argv: string[]): ParsedArgs {
  const positional: string[] = [];
  const flags: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const eq = arg.indexOf("=");
      if (eq !== -1) {
        flags[arg.slice(2, eq)] = arg.slice(eq + 1);
      } else if (i + 1 < argv.length && !argv[i + 1].startsWith("--")) {
        flags[arg.slice(2)] = argv[++i];
      } else {
        flags[arg.slice(2)] = true;
      }
    } else {
      positional.push(arg);
    }
  }
  return { positional, flags };
}

/** Split a comma-separated flag value into a trimmed list. */
export function csv(value: string | boolean | undefined, fallback: string[] = []): string[] {
  if (typeof value !== "string" || value.trim() === "") return fallback;
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}
