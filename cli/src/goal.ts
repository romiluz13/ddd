/**
 * goal(claim_id) -> goal_entry
 *
 * Declares a claim as an assurance-case goal in .ddd/goals.yaml. Declared
 * goals are included in every case built for the project, so a case always
 * has reachable goals even when the changed-symbol matching heuristic finds
 * no relevant claims. Idempotent per claim.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Claim } from "./types";
import { nextId, nowIso, parseYaml, readText, writeText, yamlScalar } from "./utils";

const GOALS_HEADER = `# DDD Case Goals
# Claims declared as assurance-case goals. Every built case includes these
# claims as goals in addition to claims traced into the change envelope.

schema_version: 0.1.0

goals: []
`;

export interface GoalEntry {
  id: string;
  schema_version: string;
  claim: string;
  statement?: string;
  created_at: string;
}

export interface AddGoalOptions {
  statement?: string;
}

export function addGoal(dddDir: string, claimId: string, opts: AddGoalOptions = {}): GoalEntry {
  const claimsPath = join(dddDir, "claims.yaml");
  if (!existsSync(claimsPath)) {
    throw new Error(`Claims ledger not found at ${claimsPath}; record a claim first (ddd claim ...)`);
  }
  const claimsDoc = parseYaml(readText(claimsPath)) as { entries?: Claim[] };
  const claims = Array.isArray(claimsDoc.entries) ? claimsDoc.entries : [];
  const claim = claims.find((candidate) => candidate.id === claimId);
  if (!claim) {
    const known = claims.map((candidate) => candidate.id).join(", ");
    throw new Error(
      `Claim ${claimId} not found in ${claimsPath}${known ? ` (known claims: ${known})` : ""}`,
    );
  }
  if (claim.status === "retracted") {
    throw new Error(`Claim ${claimId} is retracted and cannot be declared as a goal`);
  }

  const goalsPath = join(dddDir, "goals.yaml");
  let text = existsSync(goalsPath) ? readText(goalsPath) : GOALS_HEADER;
  const doc = (parseYaml(text) as { goals?: GoalEntry[] }) ?? {};
  const goals = Array.isArray(doc.goals) ? doc.goals : [];
  const existing = goals.find((goal) => goal.claim === claimId);
  if (existing) return existing; // idempotent: one goal per claim

  const entry: GoalEntry = {
    id: nextId(goals, "GOAL"),
    schema_version: "0.1.0",
    claim: claimId,
    statement: opts.statement ?? claim.statement,
    created_at: nowIso(),
  };

  if (/^goals:\s*\[\]\s*$/m.test(text)) {
    text = text.replace(/^goals:\s*\[\]\s*$/m, "goals:");
  } else if (!/^\s*goals:/m.test(text)) {
    if (!text.endsWith("\n")) text += "\n";
    text += "\ngoals:\n";
  }
  if (!text.endsWith("\n")) text += "\n";
  text += serializeGoal(entry);
  writeText(goalsPath, text);
  return entry;
}

function serializeGoal(goal: GoalEntry): string {
  const lines = [
    `  - id: ${goal.id}`,
    `    schema_version: ${yamlScalar(goal.schema_version)}`,
    `    claim: ${yamlScalar(goal.claim)}`,
  ];
  if (goal.statement) lines.push(`    statement: ${yamlScalar(goal.statement)}`);
  lines.push(`    created_at: ${yamlScalar(goal.created_at)}`);
  return `${lines.join("\n")}\n`;
}
