#!/usr/bin/env bun
/**
 * ddd — Docs-Driven Development machine API CLI (SPEC.md §15.3).
 *
 * Usage: bun run cli/bin/ddd.ts <command> [args] [--flags]
 */
import { classifyReport } from "../src/classify";
import { driftCheck } from "../src/drift";
import { lockEvidence } from "../src/lock";
import { sweep, type SweepDirection } from "../src/sweep";
import { addTrace } from "../src/trace";
import { isStubPrimitive, runStub } from "../src/stubs";
import { csv, findDddDir, parseArgs } from "../src/utils";

const HELP = `ddd — Docs-Driven Development machine API CLI (SPEC.md §15.3)

Usage:
  bun run cli/bin/ddd.ts <command> [args] [--flags]

Commands (implemented):
  classify "<change description>"   Classify a change into taxonomy domains
  lock <url> [options]              Fetch a source, hash it, append to .ddd/evidence.lock
      --source-class <class>          standard | vendor-doc | source-code | waiver (default: vendor-doc)
      --publisher <name>              Source publisher (default: URL host)
      --product <name>                Product name (default: URL host)
      --version <v>                   Source version (default: latest)
      --sections <a,b,c>              Sections relied upon
      --status <s>                    normative | informative (default: normative)
      --authority <a,b,c>             Authority domains (authority_for)
      --freshness <90d>               Freshness window (default: 90d)
      --adapter <name>                Retrieval adapter (default: web-fetch)
      --license <name>                Source license (default: open)
      --independence <level>          external | internal (default: external)
      --notes "<text>"                Free-form notes
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
  discover, packet, claim, refute, exception, obligation, compile

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
      const entry = await lockEvidence(dddDir, url, {
        sourceClass: str(flags["source-class"]),
        publisher: str(flags.publisher),
        product: str(flags.product),
        version: str(flags.version),
        sections: csv(flags.sections),
        status: str(flags.status),
        authorityFor: csv(flags.authority),
        freshness: str(flags.freshness),
        adapter: str(flags.adapter),
        license: str(flags.license),
        independence: str(flags.independence),
        notes: str(flags.notes),
      });
      console.log(JSON.stringify(entry, null, 2));
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
