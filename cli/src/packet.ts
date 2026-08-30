/**
 * packet(change, claims) -> evidence_packet
 *
 * Builds a small, change-specific index over claims and their captured source
 * documents. The packet references immutable cache files instead of copying
 * source content into another artifact.
 */
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { Claim, EvidenceLockEntry } from "./types";
import { nowIso, parseYaml, readText, sha256Digest, writeText, yamlFlowList, yamlScalar } from "./utils";

export interface EvidencePacket {
  schema_version: string;
  id: string;
  change_id: string;
  claims: string[];
  evidence: string[];
  evidence_files: string[];
  passports: string[];
  obligations: string[];
  invariants: string[];
  forbidden: string[];
  validations_required: string[];
  context_budget: {
    max_chars: number;
    content_chars: number;
    sections_selected: number;
  };
  assembled_at: string;
  packet_digest: string;
}

export function assemblePacket(
  dddDir: string,
  changeId: string,
  claimIds: string[],
  maxChars = 100_000,
): EvidencePacket {
  if (claimIds.length === 0) throw new Error("--claims requires at least one claim ID");

  const claimsPath = join(dddDir, "claims.yaml");
  const lockPath = join(dddDir, "evidence.lock");
  if (!existsSync(claimsPath)) throw new Error(`Claim ledger not found at ${claimsPath}`);
  if (!existsSync(lockPath)) throw new Error(`Evidence lock not found at ${lockPath}`);

  const claimDoc = parseYaml(readText(claimsPath)) as { entries?: Claim[] };
  const lockDoc = parseYaml(readText(lockPath)) as { entries?: EvidenceLockEntry[] };
  const claims = Array.isArray(claimDoc.entries) ? claimDoc.entries : [];
  const evidenceEntries = Array.isArray(lockDoc.entries) ? lockDoc.entries : [];
  const requestedClaims = claimIds.map((id) => {
    const claim = claims.find((candidate) => candidate.id === id);
    if (!claim) throw new Error(`Claim ${id} not found in ${claimsPath}`);
    if (claim.status !== "known-and-supported") {
      throw new Error(`Claim ${id} is not active supported evidence`);
    }
    if (
      claim.sources.some(
        (source) =>
          !["explicit", "implicit", "paraphrase"].includes(source.entailment ?? "") ||
          (source.entailment === "implicit" && !claim.rationale?.trim()),
      )
    ) {
      throw new Error(`Claim ${id} does not have usable entailment`);
    }
    return claim;
  });

  const evidenceIds = [
    ...new Set(requestedClaims.flatMap((claim) => claim.sources.map((source) => source.ref.split("#", 1)[0]))),
  ];
  let contentChars = 0;
  const evidenceFiles = evidenceIds.map((id) => {
    const evidence = evidenceEntries.find((entry) => entry.id === id);
    if (!evidence) throw new Error(`Evidence ${id} referenced by packet claims was not found`);
    if (evidence.revoked || evidence.superseded_by) throw new Error(`Evidence ${id} is inactive`);
    if (!evidence.cache_path) throw new Error(`Evidence ${id} has no captured content`);
    const cachedPath = join(dddDir, evidence.cache_path);
    if (!existsSync(cachedPath)) throw new Error(`Captured content for ${id} is missing`);
    const capturedContent = readText(cachedPath);
    if (sha256Digest(capturedContent) !== evidence.content_digest) {
      throw new Error(`Captured content for ${id} does not match its digest`);
    }
    contentChars += capturedContent.length;
    return evidence.cache_path;
  });
  if (contentChars > maxChars) {
    throw new Error(`Packet content is ${contentChars} characters, exceeding --max-chars ${maxChars}`);
  }
  const validationsRequired = [
    ...new Set(requestedClaims.flatMap((claim) => claim.validations ?? [])),
  ];
  const sectionsSelected = requestedClaims.reduce(
    (count, claim) => count + claim.sources.filter((source) => source.ref.includes("#")).length,
    0,
  );

  const id = nextPacketId(join(dddDir, "packets"));
  const assembledAt = nowIso();
  const digestInput = JSON.stringify({
    schema_version: "0.1.0",
    id,
    change_id: changeId,
    claims: claimIds,
    evidence: evidenceIds,
    evidence_files: evidenceFiles,
    passports: [],
    obligations: [],
    invariants: [],
    forbidden: [],
    validations_required: validationsRequired,
    context_budget: {
      max_chars: maxChars,
      content_chars: contentChars,
      sections_selected: sectionsSelected,
    },
    assembled_at: assembledAt,
  });
  const packet: EvidencePacket = {
    schema_version: "0.1.0",
    id,
    change_id: changeId,
    claims: claimIds,
    evidence: evidenceIds,
    evidence_files: evidenceFiles,
    passports: [],
    obligations: [],
    invariants: [],
    forbidden: [],
    validations_required: validationsRequired,
    context_budget: {
      max_chars: maxChars,
      content_chars: contentChars,
      sections_selected: sectionsSelected,
    },
    assembled_at: assembledAt,
    packet_digest: sha256Digest(digestInput),
  };

  writeText(join(dddDir, "packets", `${id}.yaml`), serializePacket(packet));
  return packet;
}

function nextPacketId(packetsDir: string): string {
  if (!existsSync(packetsDir)) return "PKT-001";
  let max = 0;
  for (const name of readdirSync(packetsDir)) {
    const match = name.match(/^PKT-(\d+)\.yaml$/);
    if (match) max = Math.max(max, Number(match[1]));
  }
  return `PKT-${String(max + 1).padStart(3, "0")}`;
}

function serializePacket(packet: EvidencePacket): string {
  return [
    `schema_version: ${yamlScalar(packet.schema_version)}`,
    `id: ${packet.id}`,
    `change_id: ${yamlScalar(packet.change_id)}`,
    `claims: ${yamlFlowList(packet.claims)}`,
    `evidence: ${yamlFlowList(packet.evidence)}`,
    `evidence_files: ${yamlFlowList(packet.evidence_files)}`,
    `passports: ${yamlFlowList(packet.passports)}`,
    `obligations: ${yamlFlowList(packet.obligations)}`,
    `invariants: ${yamlFlowList(packet.invariants)}`,
    `forbidden: ${yamlFlowList(packet.forbidden)}`,
    `validations_required: ${yamlFlowList(packet.validations_required)}`,
    "context_budget:",
    `  max_chars: ${packet.context_budget.max_chars}`,
    `  content_chars: ${packet.context_budget.content_chars}`,
    `  sections_selected: ${packet.context_budget.sections_selected}`,
    `assembled_at: ${yamlScalar(packet.assembled_at)}`,
    `packet_digest: ${yamlScalar(packet.packet_digest)}`,
    "",
  ].join("\n");
}
