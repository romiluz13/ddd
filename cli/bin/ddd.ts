#!/usr/bin/env bun
/**
 * Proofline change-assurance CLI. The ddd name is retained for compatibility.
 *
 * Usage: bun run cli/bin/ddd.ts <command> [args] [--flags]
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { evaluateAssuranceCase } from "../src/assurance";
import { buildAssuranceCase, loadAssuranceCase } from "../src/build-case";
import { classifyReport } from "../src/classify";
import { addClaim, type ClaimImpact, type ClaimKind } from "../src/claim";
import { driftCheck } from "../src/drift";
import { doctor } from "../src/doctor";
import { addException } from "../src/exception";
import { addGoal } from "../src/goal";
import { addObligation } from "../src/obligation";
import { LOCKABLE_SOURCE_CLASSES, lockEvidence } from "../src/lock";
import { assemblePacket } from "../src/packet";
import { scopeChange } from "../src/scope-change";
import { sweep, type SweepDirection } from "../src/sweep";
import { addTrace } from "../src/trace";
import { addValidation } from "../src/validation";
import { isStubPrimitive, runStub } from "../src/stubs";
import { csv, findDddDir, parseArgs, readText } from "../src/utils";

const HELP = `proofline — change assurance (ddd compatibility command)

Usage:
  bun run cli/bin/ddd.ts <command> [args] [--flags]

Commands (implemented):
  classify "<change description>"   Classify a change into taxonomy domains
  lock <url> [options]              Fetch a source, hash it, append to .ddd/evidence.lock
      --source-class <class>          standard | vendor-doc | source-code (default: vendor-doc)
      --publisher <name>              Source publisher (default: URL host)
      --product <name>                Product name (default: URL host)
      --ref <REF-NNN>                 Book reference satisfied by this evidence
      --subject <name>                Exact stack component covered by this evidence
      --version <v>                   Source version (required for external documentation)
      --sections <a,b,c>              Sections relied upon
      --status <s>                    normative | informative (default: normative)
      --authority <a,b,c>             Authority domains (authority_for)
      --freshness <90d>               Freshness window (default: 90d)
      --adapter <name>                Retrieval adapter (default: web-fetch)
      --license <name>                Source license (default: open)
      --independence <level>          external | human-authored | agent-proposed-human-approved | agent-authored-unapproved
      --notes "<text>"                Free-form notes
      --content-file <path>            Lock already-retrieved content without a network request
  claim "<statement>" [options]     Record an API claim against locked evidence
      --source <EL-NNN[#section]>      Required locked evidence reference
      --authority <domain>             Required claim authority domain
      --kind <kind>                     mechanical | api | behavioral | architectural | operational
      --impact <impact>                 low | medium | high | critical
      --entailment <result>             Required positive assessment: explicit | implicit | paraphrase
      --construct <symbol[,symbol]>     Optional implementation symbols
      --validation <id[,id]>            Validation IDs (required for T2/T3 conformance)
      --rationale "<text>"              Optional rationale
  packet <change_id> --claims <ids> Build a bounded packet from selected claims
      --max-chars <n>                  Maximum captured-content characters (default: 100000)
  sweep [--direction <dir>]         Compliance sweep over claims + trace matrix
                                      dir: forward | reverse | both (default: both)
  validation [options]              Record a validation run for a claim construct
      --claim <C-NNN>                 Required: claim being validated
      --construct <symbol>            Required: must equal a claim constructs[] entry
      --method <m>                    Required: test | lint | type-check | formal | manual | runtime-assertion
      --target <file>                 Required: artifact the run executed (hash auto-computed)
      --result <r>                    pass | fail (default: pass)
      --hash <sha256:...>             Explicit artifact digest for non-file targets
      --notes "<text>"                Free-form notes
  goal --claim <C-NNN>               Declare a claim as an assurance-case goal
      --statement "<text>"            Optional goal statement (defaults to claim statement)
  exception [options]                Record an approved, time-boxed waiver
      --goal <C-NNN>                  Target: goal claim being waived
      --capability <name>             Target: consumer_impact | contract_compatibility
                                      (required capabilities no tool evaluates)
      --rationale "<text>"            Required: the accepted residual risk
      --owner <name>                  Required: accountable human
      --expires <date>                Required: future ISO date (YYYY-MM-DD[THH:MM:SSZ])
  obligation [options]               Bind an unresolved defeater to a tracking issue
      --defeater <id>                 Required: defeater id (stack:... or capability:...)
      --issue <url>                   Required: http(s) issue URL
      --description "<text>"          Optional: what evidence will resolve it
      --due <YYYY-MM-DD>              Optional: due date
  trace <claim_id> <construct>      Append a trace entry to .ddd/trace-matrix.yaml
      --change <CH-NNN>               Change record id
      --direction <forward|reverse>   Trace direction (default: forward)
      --validation <V-NNN>            Validation id
      --notes "<text>"                Free-form notes
  drift-check                       Freshness drift report over .ddd/evidence.lock
                                      (alias: drift_check)
  doctor                            Check repository-local installed skill copies
  scope-change --base <rev> --head <rev>
                                    Inventory a bounded change and its stack layers
                                    (idempotent per range + detector version; an
                                    envelope from an older detector is regenerated)
      --risk <level>                  low | medium | high | critical (default: medium)
      --owner <name>                  Accountable change owner
  build-case <ENV-NNN|path>         Build a typed assurance case from DDD artifacts
  evaluate-case <CASE-NNN|path>     Evaluate a case and write its assurance report

Commands (stubs — print "not yet implemented"):
  discover, refute, compile

Other:
  --ddd-dir <path>                  Override the .ddd directory (default: nearest ancestor)
  --help, -h                        Show this help

All commands read/write compatibility artifacts in the .ddd/ directory (found by walking
up from the current working directory). Reports are emitted as JSON on stdout.
`;

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const command = argv[0];

  if (!command || command === "--help" || command === "-h" || command === "help") {
    console.log(HELP);
    return;
  }

  const { positional, flags } = parseArgs(argv.slice(1));
  const dddDir = typeof flags["ddd-dir"] === "string" ? (flags["ddd-dir"] as string) : findDddDir();

  switch (command) {
    case "classify": {
      const change = positional.join(" ").trim();
      if (!change) {
        console.error('Usage: ddd classify "<change description>"');
        process.exit(2);
      }
      console.log(JSON.stringify(classifyReport(change), null, 2));
      return;
    }

    case "lock": {
      const url = positional[0];
      if (!url) {
        console.error("Usage: ddd lock <url> [options]");
        process.exit(2);
      }
      const sourceClass = str(flags["source-class"]) ?? "vendor-doc";
      const version = str(flags.version);
      if (!LOCKABLE_SOURCE_CLASSES.includes(sourceClass as (typeof LOCKABLE_SOURCE_CLASSES)[number])) {
        throw new Error(`--source-class must be one of: ${LOCKABLE_SOURCE_CLASSES.join(", ")}`);
      }
      if (!version) {
        throw new Error("--version is required for external documentation");
      }
      const entry = await lockEvidence(dddDir, url, {
        sourceClass,
        publisher: str(flags.publisher),
        product: str(flags.product),
        ref: str(flags.ref),
        subject: str(flags.subject),
        version,
        sections: csv(flags.sections),
        status: str(flags.status),
        authorityFor: csv(flags.authority),
        freshness: str(flags.freshness),
        adapter: str(flags.adapter),
        license: str(flags.license),
        independence: str(flags.independence),
        notes: str(flags.notes),
        contentOverride: str(flags["content-file"]) ? readText(str(flags["content-file"])!) : undefined,
      });
      console.log(JSON.stringify(entry, null, 2));
      return;
    }

    case "claim": {
      const statement = positional.join(" ").trim();
      const sourceRef = str(flags.source);
      const authorityDomain = str(flags.authority);
      const kind = str(flags.kind) as ClaimKind | undefined;
      const impact = str(flags.impact) as ClaimImpact | undefined;
      const entailment = str(flags.entailment) as
        | "explicit"
        | "implicit"
        | "paraphrase"
        | undefined;
      if (!statement || !sourceRef || !authorityDomain || !kind || !impact || !entailment) {
        console.error(
          'Usage: ddd claim "<statement>" --source <EL-NNN[#section]> --authority <domain> --kind <kind> --impact <impact> --entailment <result>',
        );
        process.exit(2);
      }
      if (!["mechanical", "api", "behavioral", "architectural", "operational"].includes(kind)) {
        throw new Error("--kind must be one of: mechanical, api, behavioral, architectural, operational");
      }
      if (!["low", "medium", "high", "critical"].includes(impact)) {
        throw new Error("--impact must be one of: low, medium, high, critical");
      }
      if (!["explicit", "implicit", "paraphrase"].includes(entailment)) {
        throw new Error("--entailment must be one of: explicit, implicit, paraphrase");
      }
      const claim = addClaim(dddDir, statement, {
        sourceRef,
        authorityDomain,
        kind,
        impact,
        rationale: str(flags.rationale),
        constructs: csv(flags.construct),
        validations: csv(flags.validation),
        entailment,
      });
      console.log(JSON.stringify(claim, null, 2));
      return;
    }

    case "packet": {
      const changeId = positional[0];
      const claimIds = csv(flags.claims);
      const maxChars = Number(str(flags["max-chars"]) ?? "100000");
      if (!changeId || claimIds.length === 0) {
        console.error("Usage: ddd packet <change_id> --claims <C-NNN[,C-NNN]> [--max-chars <n>]");
        process.exit(2);
      }
      if (!Number.isSafeInteger(maxChars) || maxChars < 1) {
        throw new Error("--max-chars must be a positive integer");
      }
      console.log(JSON.stringify(assemblePacket(dddDir, changeId, claimIds, maxChars), null, 2));
      return;
    }

    case "sweep": {
      const direction = (str(flags.direction) ?? "both") as SweepDirection;
      if (!["forward", "reverse", "both"].includes(direction)) {
        console.error("--direction must be one of: forward, reverse, both");
        process.exit(2);
      }
      const report = sweep(dddDir, direction);
      console.log(JSON.stringify(report, null, 2));
      if (!report.pass) process.exit(1);
      return;
    }

    case "trace": {
      const [claimId, construct] = positional;
      if (!claimId || !construct) {
        console.error("Usage: ddd trace <claim_id> <construct> [--direction forward|reverse]");
        process.exit(2);
      }
      const entry = addTrace(dddDir, claimId, construct, {
        changeId: str(flags.change),
        direction: (str(flags.direction) ?? "forward") as "forward" | "reverse",
        validationId: str(flags.validation),
        notes: str(flags.notes),
      });
      console.log(JSON.stringify(entry, null, 2));
      return;
    }

    case "validation": {
      const claimId = str(flags.claim);
      const construct = str(flags.construct);
      const method = str(flags.method);
      const target = str(flags.target);
      if (!claimId || !construct || !method || !target) {
        console.error(
          "Usage: ddd validation --claim <C-NNN> --construct <symbol> --method <test|lint|type-check|formal|manual|runtime-assertion> --target <file>",
        );
        process.exit(2);
      }
      const result = str(flags.result) as "pass" | "fail" | undefined;
      if (result !== undefined && !["pass", "fail"].includes(result)) {
        throw new Error("--result must be one of: pass, fail");
      }
      const record = addValidation(dddDir, {
        claimId,
        construct,
        method,
        target,
        result,
        evidenceHash: str(flags.hash),
        notes: str(flags.notes),
      });
      console.log(JSON.stringify(record, null, 2));
      return;
    }

    case "goal": {
      const claimId = str(flags.claim);
      if (!claimId) {
        console.error("Usage: ddd goal --claim <C-NNN> [--statement \"<text>\"]");
        process.exit(2);
      }
      const entry = addGoal(dddDir, claimId, { statement: str(flags.statement) });
      console.log(JSON.stringify(entry, null, 2));
      return;
    }

    case "exception": {
      const goal = str(flags.goal);
      const capability = str(flags.capability);
      const rationale = str(flags.rationale);
      const owner = str(flags.owner);
      const expiresAt = str(flags.expires);
      if ((!goal && !capability) || (goal && capability) || !rationale || !owner || !expiresAt) {
        console.error(
          'Usage: ddd exception (--goal <C-NNN> | --capability <consumer_impact|contract_compatibility>) ' +
            '--rationale "<accepted risk>" --owner <name> --expires <future ISO date>',
        );
        process.exit(2);
      }
      const entry = addException(dddDir, goal || null, {
        rationale,
        owner,
        expiresAt,
        capability: capability || undefined,
      });
      console.log(JSON.stringify(entry, null, 2));
      return;
    }

    case "obligation": {
      const defeater = positional[0] ?? str(flags.defeater);
      const issue = str(flags.issue);
      if (!defeater || !issue) {
        console.error('Usage: ddd obligation --defeater <id> --issue <https://...> [--description "<text>"] [--due YYYY-MM-DD]');
        process.exit(2);
      }
      const entry = addObligation(dddDir, defeater, {
        issue,
        description: str(flags.description),
        dueAt: str(flags.due),
      });
      console.log(JSON.stringify(entry, null, 2));
      return;
    }

    case "drift-check":
    case "drift_check":
    case "drift": {
      console.log(JSON.stringify(driftCheck(dddDir), null, 2));
      return;
    }

    case "doctor": {
      const report = doctor(dirname(dddDir));
      console.log(JSON.stringify(report, null, 2));
      if (!report.pass) process.exit(1);
      return;
    }

    case "scope-change": {
      const base = str(flags.base);
      const head = str(flags.head);
      const risk = (str(flags.risk) ?? "medium") as "low" | "medium" | "high" | "critical";
      if (!base || !head) {
        console.error("Usage: ddd scope-change --base <revision> --head <revision> [--risk <level>]");
        process.exit(2);
      }
      if (!["low", "medium", "high", "critical"].includes(risk)) {
        throw new Error("--risk must be one of: low, medium, high, critical");
      }
      console.log(
        JSON.stringify(
          scopeChange(dirname(dddDir), dddDir, {
            base,
            head,
            risk,
            owner: str(flags.owner),
            onRegenerate: (info) => {
              console.error(
                `${info.id}: regenerated in place (detector ${info.from ?? "unknown"} -> ${info.to}); ` +
                  "the cached envelope for this range predates the current detector. Rebuild dependent cases.",
              );
            },
          }),
          null,
          2,
        ),
      );
      return;
    }

    case "build-case": {
      const envelope = positional[0];
      if (!envelope) {
        console.error("Usage: ddd build-case <ENV-NNN|path>");
        process.exit(2);
      }
      console.log(JSON.stringify(buildAssuranceCase(dddDir, envelope), null, 2));
      return;
    }

    case "evaluate-case": {
      const caseId = positional[0];
      if (!caseId) {
        console.error("Usage: ddd evaluate-case <CASE-NNN|path>");
        process.exit(2);
      }
      const assuranceCase = loadAssuranceCase(dddDir, caseId);
      const report = evaluateAssuranceCase(assuranceCase);
      const reportsDir = join(dddDir, "reports");
      mkdirSync(reportsDir, { recursive: true });
      writeFileSync(
        join(reportsDir, `${assuranceCase.id}.assurance.json`),
        `${JSON.stringify(report, null, 2)}\n`,
      );
      // Human summary on stderr; the JSON report stays the only stdout output.
      const counts = new Map<string, number>();
      for (const violation of report.violations) {
        counts.set(violation.type, (counts.get(violation.type) ?? 0) + 1);
      }
      const byType = [...counts.entries()].map(([type, count]) => `${type}: ${count}`).join(", ");
      console.error(`Case ${assuranceCase.id}: ${report.verdict}`);
      if (report.violations.length > 0) {
        console.error(`Violations: ${report.violations.length}${byType ? ` (${byType})` : ""}`);
        for (const violation of report.violations.slice(0, 5)) {
          console.error(`  - [${violation.type}] ${violation.message}`);
          if (violation.resolution) console.error(`    fix: ${violation.resolution}`);
        }
        if (report.violations.length > 5) {
          console.error(`  ... and ${report.violations.length - 5} more (see JSON report)`);
        }
      }
      if (report.open_defeaters.length > 0) {
        console.error(`Open defeaters: ${report.open_defeaters.join(", ")}`);
      }
      if (report.open_obligations.length > 0) {
        console.error(`Open obligations: ${report.open_obligations.join(", ")}`);
      }
      console.error(`Report: ${join(reportsDir, `${assuranceCase.id}.assurance.json`)}`);
      console.log(JSON.stringify(report, null, 2));
      if (!["SATISFIED", "WAIVED"].includes(report.verdict)) process.exit(1);
      return;
    }

    default: {
      if (isStubPrimitive(command)) {
        runStub(command);
        return;
      }
      console.error(`Unknown command: ${command}\n`);
      console.log(HELP);
      process.exit(2);
    }
  }
}

function str(v: string | boolean | undefined): string | undefined {
  return typeof v === "string" ? v : undefined;
}

main().catch((err) => {
  console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
