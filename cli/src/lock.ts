/**
 * lock(evidence[]) -> lock_entry
 *
 * Fetches a URL, computes a sha256 content digest, and appends an immutable
 * entry to .ddd/evidence.lock (schema: SPEC.md §7.3). Entries are append-only.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { EvidenceLockEntry } from "./types";
import {
  nextId,
  nowIso,
  parseYaml,
  readText,
  sha256Digest,
  writeText,
  yamlFlowList,
  yamlScalar,
} from "./utils";

const LOCK_HEADER = `# DDD Evidence Lock
# Immutable, append-only record of external source provenance.
# Schema: SPEC.md §7.3

schema_version: 0.1.0

entries:
`;

export interface LockOptions {
  sourceClass?: string;
  publisher?: string;
  product?: string;
  version?: string;
  sections?: string[];
  status?: string;
  authorityFor?: string[];
  freshness?: string;
  adapter?: string;
  license?: string;
  independence?: string;
  notes?: string;
  /** Skip the network fetch and use this content directly (for tests/offline use). */
  contentOverride?: string;
}

function serializeEntry(e: EvidenceLockEntry): string {
  const lines = [
    `  - id: ${e.id}`,
    `    schema_version: ${yamlScalar(e.schema_version)}`,
    `    source_class: ${yamlScalar(e.source_class)}`,
    `    source_url: ${yamlScalar(e.source_url)}`,
    `    publisher: ${yamlScalar(e.publisher)}`,
    `    product: ${yamlScalar(e.product)}`,
    `    version: ${yamlScalar(e.version)}`,
    `    retrieved_at: ${yamlScalar(e.retrieved_at)}`,
    `    content_digest: ${yamlScalar(e.content_digest)}`,
    `    doc_version: ${yamlScalar(e.doc_version)}`,
    `    sections: ${yamlFlowList(e.sections)}`,
    `    status: ${yamlScalar(e.status)}`,
    `    authority_for: ${yamlFlowList(e.authority_for)}`,
    `    freshness: ${yamlScalar(e.freshness)}`,
    `    adapter: ${yamlScalar(e.adapter)}`,
    `    license: ${yamlScalar(e.license)}`,
    `    independence: ${yamlScalar(e.independence)}`,
    `    superseded_by: null`,
  ];
  if (e.notes) lines.push(`    notes: ${yamlScalar(e.notes)}`);
  return lines.join("\n") + "\n";
}

/**
 * Fetch `url`, hash the content, and append an evidence lock entry.
 * Returns the created entry.
 */
export async function lockEvidence(
  dddDir: string,
  url: string,
  opts: LockOptions = {},
): Promise<EvidenceLockEntry> {
  let content: string;
  if (opts.contentOverride !== undefined) {
    content = opts.contentOverride;
  } else {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch ${url}: HTTP ${res.status} ${res.statusText}`);
    }
    content = await res.text();
  }

  const digest = sha256Digest(content);
  const retrievedAt = nowIso();

  const lockPath = join(dddDir, "evidence.lock");
  const existingText = existsSync(lockPath) ? readText(lockPath) : LOCK_HEADER;
  const doc = (parseYaml(existingText) as { entries?: EvidenceLockEntry[] }) ?? {};
  const entries = Array.isArray(doc.entries) ? doc.entries : [];

  const host = safeHost(url);
  const entry: EvidenceLockEntry = {
    id: nextId(entries, "EL"),
    schema_version: "0.1.0",
    source_class: opts.sourceClass ?? "vendor-doc",
    source_url: url,
    publisher: opts.publisher ?? host,
    product: opts.product ?? host,
    version: opts.version ?? "latest",
    retrieved_at: retrievedAt,
    content_digest: digest,
    doc_version: retrievedAt.slice(0, 10),
    sections: opts.sections ?? [],
    status: opts.status ?? "normative",
    authority_for: opts.authorityFor ?? [],
    freshness: opts.freshness ?? "90d",
    adapter: opts.adapter ?? "web-fetch",
    license: opts.license ?? "open",
    independence: opts.independence ?? "external",
    superseded_by: null,
    notes: opts.notes,
  };

  // Append-only: add the serialized entry at the end of the file, preserving
  // all existing content and comments verbatim.
  let text = existingText;
  if (!text.endsWith("\n")) text += "\n";
  if (!/^\s*entries:/m.test(text)) text += "\nentries:\n";
  text += "\n" + serializeEntry(entry);
  writeText(lockPath, text);

  return entry;
}

function safeHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}
