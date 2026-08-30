#!/usr/bin/env bun
/**
 * ddd — Docs-Driven Development machine API CLI (SPEC.md §15.3).
 *
 * Usage: bun run cli/bin/ddd.ts <command> [args] [--flags]
 */
import { classifyReport } from "../src/classify";
import { addClaim, type ClaimImpact, type ClaimKind } from "../src/claim";
import { driftCheck } from "../src/drift";
import { LOCKABLE_SOURCE_CLASSES, lockEvidence } from "../src/lock";
import { assemblePacket } from "../src/packet";
import { sweep, type SweepDirection } from "../src/sweep";
import { addTrace } from "../src/trace";
import { isStubPrimitive, runStub } from "../src/stubs";
import { csv, findDddDir, parseArgs, readText } from "../src/utils";

const HELP = `ddd — Docs-Driven Development machine API CLI (SPEC.md §15.3)

Usage:
  bun run cli/bin/ddd.ts <command> [args] [--flags]

Commands (implemented):
  classify "<change description>"   Classify a change into taxonomy domains
  lock <url> [options]              Fetch a source, hash it, append to .ddd/evidence.lock
      --source-class <class>          standard | vendor-doc | source-code (default: vendor-doc)
      --publisher <name>              Source publisher (default: URL host)
      --product <name>                Product name (default: URL host)
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
  trace <claim_id> <construct>      Append a trace entry to .ddd/trace-matrix.yaml
      --change <CH-NNN>               Change record id
      --direction <forward|reverse>   Trace direction (default: forward)
      --validation <V-NNN>            Validation id
      --notes "<text>"                Free-form notes
  drift-check                       Freshness drift report over .ddd/evidence.lock
                                      (alias: drift_check)

Commands (stubs — print "not yet implemented"):
  discover, refute, exception, obligation, compile

Other:
  --ddd-dir <path>                  Override the .ddd directory (default: nearest ancestor)
  --help, -h                        Show this help

All commands read/write DDD artifacts in the .ddd/ directory (found by walking
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

    case "drift-check":
    case "drift_check":
    case "drift": {
      console.log(JSON.stringify(driftCheck(dddDir), null, 2));
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
