/**
 * lock(evidence[]) -> lock_entry
 *
 * Fetches a URL, computes a sha256 content digest, and appends an immutable
 * entry to .ddd/evidence.lock. Entries are append-only.
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
# Legacy evidence lock schema

schema_version: 0.1.0

entries:
`;

export const LOCKABLE_SOURCE_CLASSES = ["vendor-doc", "standard", "source-code"] as const;
export const EVIDENCE_INDEPENDENCE_LEVELS = [
  "external",
  "human-authored",
  "agent-proposed-human-approved",
  "agent-authored-unapproved",
] as const;
export const LOCKABLE_STATUSES = ["normative", "informative"] as const;

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
  contentType?: string;
  canonicalUrl?: string;
  etag?: string;
  lastModified?: string;
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
    `    cache_path: ${yamlScalar(e.cache_path ?? "")}`,
    `    sections: ${yamlFlowList(e.sections)}`,
    `    status: ${yamlScalar(e.status)}`,
    `    authority_for: ${yamlFlowList(e.authority_for)}`,
    `    freshness: ${yamlScalar(e.freshness)}`,
    `    adapter: ${yamlScalar(e.adapter)}`,
    `    license: ${yamlScalar(e.license)}`,
    `    independence: ${yamlScalar(e.independence)}`,
    `    superseded_by: null`,
  ];
  if (e.content_type) lines.push(`    content_type: ${yamlScalar(e.content_type)}`);
  if (e.canonical_url) lines.push(`    canonical_url: ${yamlScalar(e.canonical_url)}`);
  if (e.etag) lines.push(`    etag: ${yamlScalar(e.etag)}`);
  if (e.last_modified) lines.push(`    last_modified: ${yamlScalar(e.last_modified)}`);
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
  const sourceClass = opts.sourceClass ?? "vendor-doc";
  if (!LOCKABLE_SOURCE_CLASSES.includes(sourceClass as (typeof LOCKABLE_SOURCE_CLASSES)[number])) {
    throw new Error(`Unsupported source class "${sourceClass}" for external evidence lock`);
  }
  if (!opts.version?.trim() || ["latest", "unversioned"].includes(opts.version.trim().toLowerCase())) {
    throw new Error("An explicit version is required for external documentation");
  }
  const status = opts.status ?? "normative";
  if (!LOCKABLE_STATUSES.includes(status as (typeof LOCKABLE_STATUSES)[number])) {
    throw new Error(`Unsupported evidence status "${status}"`);
  }
  const independence = opts.independence ?? "external";
  if (
    !EVIDENCE_INDEPENDENCE_LEVELS.includes(
      independence as (typeof EVIDENCE_INDEPENDENCE_LEVELS)[number],
    )
  ) {
    throw new Error(`Unsupported evidence independence "${independence}"`);
  }
  let content: string;
  let contentType = opts.contentType;
  let canonicalUrl = opts.canonicalUrl;
  let etag = opts.etag;
  let lastModified = opts.lastModified;
  if (opts.contentOverride !== undefined) {
    content = opts.contentOverride;
  } else {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch ${url}: HTTP ${res.status} ${res.statusText}`);
    }
    content = await res.text();
    contentType = contentType ?? res.headers.get("content-type") ?? undefined;
    canonicalUrl = canonicalUrl ?? res.url;
    etag = etag ?? res.headers.get("etag") ?? undefined;
    lastModified = lastModified ?? res.headers.get("last-modified") ?? undefined;
  }

  const digest = sha256Digest(content);
  const cachePath = `cache/${digest.slice("sha256:".length, "sha256:".length + 16)}.md`;
  const absoluteCachePath = join(dddDir, cachePath);
  if (existsSync(absoluteCachePath)) {
    if (sha256Digest(readText(absoluteCachePath)) !== digest) {
      throw new Error(`Cache digest mismatch at ${absoluteCachePath}`);
    }
  } else {
    writeText(absoluteCachePath, content);
  }
  const retrievedAt = nowIso();

  const lockPath = join(dddDir, "evidence.lock");
  const existingText = existsSync(lockPath) ? readText(lockPath) : LOCK_HEADER;
  const doc = (parseYaml(existingText) as { entries?: EvidenceLockEntry[] }) ?? {};
  const entries = Array.isArray(doc.entries) ? doc.entries : [];

  const host = safeHost(url);
  const entry: EvidenceLockEntry = {
    id: nextId(entries, "EL"),
    schema_version: "0.1.0",
    source_class: sourceClass,
    source_url: url,
    publisher: opts.publisher ?? host,
    product: opts.product ?? host,
    version: opts.version ?? "unversioned",
    retrieved_at: retrievedAt,
    content_digest: digest,
    doc_version: opts.version ?? "unversioned",
    cache_path: cachePath,
    content_type: contentType,
    canonical_url: canonicalUrl,
    etag,
    last_modified: lastModified,
    sections: opts.sections ?? [],
    status,
    authority_for: opts.authorityFor ?? [],
    freshness: opts.freshness ?? "90d",
    adapter: opts.adapter ?? "web-fetch",
    license: opts.license ?? "open",
    independence,
    superseded_by: null,
    notes: opts.notes,
  };

  // Append-only: add the serialized entry at the end of the file, preserving
  // all existing content and comments verbatim.
  let text = existingText;
  if (!text.endsWith("\n")) text += "\n";
  if (/^entries:\s*\[\]\s*$/m.test(text)) {
    text = text.replace(/^entries:\s*\[\]\s*$/m, "entries:");
  } else if (!/^\s*entries:/m.test(text)) {
    text += "\nentries:\n";
  }
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
