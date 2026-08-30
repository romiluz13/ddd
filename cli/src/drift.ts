/**
 * drift_check() -> drift_report[]
 *
 * Reads .ddd/evidence.lock and checks each active entry's freshness: an entry
 * is stale when now > retrieved_at + freshness window (e.g. "90d").
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { DriftReport, DriftReportEntry, EvidenceLockEntry } from "./types";
import { nowIso, parseYaml, readText } from "./utils";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Parse a freshness window like "90d" into days. Returns null if unparseable. */
export function parseFreshnessDays(freshness: unknown): number | null {
  if (typeof freshness === "number") return freshness;
  if (typeof freshness !== "string") return null;
  const m = freshness.trim().match(/^(\d+)\s*d$/i);
  return m ? parseInt(m[1], 10) : null;
}

export function driftCheck(dddDir: string, now: Date = new Date()): DriftReport {
  const lockPath = join(dddDir, "evidence.lock");
  const doc = existsSync(lockPath)
    ? (parseYaml(readText(lockPath)) as { entries?: EvidenceLockEntry[] })
    : { entries: [] };
  const entries: EvidenceLockEntry[] = Array.isArray(doc?.entries) ? doc.entries : [];

  const reportEntries: DriftReportEntry[] = entries.map((entry) => {
    const base: Omit<DriftReportEntry, "status"> = {
      entry_id: entry.id,
      source_url: entry.source_url,
      retrieved_at: entry.retrieved_at,
      freshness: entry.freshness ?? null,
      freshness_days: parseFreshnessDays(entry.freshness),
      age_days: 0,
    };

    if (entry.revoked || (entry.superseded_by && entry.superseded_by !== null)) {
      return {
        ...base,
        status: "inactive",
        reason: entry.revoked ? "revoked" : `superseded_by ${entry.superseded_by}`,
      };
    }

    const retrieved = Date.parse(entry.retrieved_at);
    if (Number.isNaN(retrieved)) {
      return { ...base, status: "unknown", reason: "unparseable retrieved_at timestamp" };
    }

    const ageDays = Math.floor((now.getTime() - retrieved) / DAY_MS);
    if (base.freshness_days === null) {
      return { ...base, age_days: ageDays, status: "unknown", reason: "no parseable freshness window" };
    }

    const expired = now.getTime() >= retrieved + base.freshness_days * DAY_MS;
    return {
      ...base,
      age_days: ageDays,
      status: expired ? "stale" : "fresh",
      reason:
        expired
          ? `age ${ageDays}d exceeds freshness window ${base.freshness_days}d`
          : undefined,
    };
  });

  return {
    schema_version: "0.1.0",
    checked_at: nowIso(),
    entries_checked: reportEntries.filter((e) => e.status === "fresh" || e.status === "stale").length,
    stale_count: reportEntries.filter((e) => e.status === "stale").length,
    entries: reportEntries,
  };
}
