# Proofline CLI (optional experimental tooling)

A preserved zero-dependency Bun CLI for external-evidence grounding and
change-bounded assurance experiments. `ddd` remains the compatibility command
name; `proofline` is an equivalent package binary. The default
[DDD methodology](../README.md) uses the agent's tools and requires none of this
setup. The CLI's preserved contract is [SPEC.md](SPEC.md); the root
[methodology specification](../SPEC.md) governs the skills-first workflow.

## Known experimental limitations

Existing commands and schemas are preserved, including unresolved defects from
the earlier assessment. These reports describe tooling behavior, not a guarantee
that its advertised assurance invariants hold:

- A recorded passing validation need not have been executed; an old validation
  for a different construct can satisfy a goal.
- Implementation-derived evidence can escape the self-support check through an
  intermediate support node.
- A rejected capability waiver can become accepted during case construction.
- A historical failed validation can block a later passing result; expired
  capability-waiver renewal can return the expired record unchanged.
- A cached envelope can ignore a changed risk level or owner.
- Code inspection also found incomplete directory-index consumer detection and
  no normal builder/CLI path to populate critical-case reviewer identities.

These findings were recorded in the prior assessment, not rerun as part of the
methodology refocus. Keep these limits visible when using the command reference
below. Passing repository tests does not resolve them. Book and exception
management are optional; a waiver records accepted risk, never correctness.

## Usage

```sh
bun run cli/bin/ddd.ts --help
```

All commands operate on the `.ddd/` directory found by walking up from the current
working directory (override with `--ddd-dir <path>`). Reports are JSON on stdout.

## Implemented primitives

| Command | Description |
|---|---|
| `classify "<change>"` | Matches a change description against the 18-dimension knowledge taxonomy and prints the relevant domains (keyword scoring, ranked). |
| `lock <url>` | Requires an explicit version and a lockable source class (`vendor-doc`, `standard`, or `source-code`), captures the exact reviewed content in `.ddd/cache/`, records its digest and HTTP provenance, and appends an immutable lock entry. Use `--ref REF-NNN` for Book completeness and `--subject <component>` for stack coverage. `--content-file` supports trusted offline retrieval. |
| `claim "<statement>"` | Records a typed claim against active locked evidence. Requires `--entailment`, validates authority, cited-section presence, cache presence, and digest integrity, and derives T0-T3 from kind and impact. |
| `packet <change_id> --claims <ids> [--max-chars <n>]` | Writes a bounded packet that references only the requested claims and their immutable cached evidence, and rejects content over the character budget. |
| `sweep [--direction forward\|reverse\|both]` | Validates Book artifact digests, declared evidence, claims, traces, derived tiers, entailment attestations, validation records, and T3 refutation metadata. Exits non-zero on violations. |
| `trace <claim_id> <construct>` | Appends a trace entry to `.ddd/trace-matrix.yaml` linking a claim to a construct. Validates the claim exists and that the construct matches a claim `constructs[]` entry verbatim. Supports `--change`, `--direction`, `--validation`, `--notes`. |
| `validation --claim <C-NNN> --construct <symbol> --method <m> --target <file>` | Records a proof run in `.ddd/reports/validations.yaml` with a closed method set (`test`, `lint`, `type-check`, `formal`, `manual`, `runtime-assertion`) and an auto-computed artifact digest, then links the record back into the claim. `--hash sha256:<64 hex>` covers non-file targets; `--result pass\|fail` and `--notes` are optional. |
| `goal --claim <C-NNN>` | Declares a claim as an assurance-case goal in `.ddd/goals.yaml`. Every built case includes declared goals in addition to change-matched claims. Idempotent per claim. |
| `exception (--goal <C-NNN> \| --capability <name>) --rationale "<risk>" --owner <name> --expires <date>` | Records an approved, time-boxed waiver in `.ddd/exceptions.yaml`. The target is a goal claim or a waivable required capability no tool evaluates (`consumer_impact`, `contract_compatibility`). The expiry must be a future ISO date; an expired waiver is invalid at evaluation time. Idempotent per capability. |
| `obligation --defeater <id> --issue <url>` | Binds an unresolved defeater (`stack:...` or `capability:<name>`) to a tracking issue in `.ddd/obligations.yaml`. Tracks work; does not resolve the defeater. Idempotent per (defeater, issue). |
| `drift-check` (alias `drift_check`, `drift`) | Freshness report over `.ddd/evidence.lock`: each active entry is `fresh` or `stale` based on `retrieved_at + freshness` vs. now. |
| `scope-change --base <rev> --head <rev>` | Creates a Git change envelope. Detects TypeScript declarations, manifest dependencies, literal services, platform configuration, frontend files, and explicit contracts. Marks stack-exercising files as `boundary_files` and partitions changed symbols into covered, boundary-relevant, and internal. Idempotent per resolved (base, head) range and detector version; an envelope cached by an older detector is regenerated in place (same `ENV` id) with a stderr notice. Book ledgers, root project docs, and hygiene files are inert (not scanned, no confidence penalty); `node:`/`bun:`/`deno:` builtins are not external dependencies. |
| `build-case <ENV-NNN\|path>` | Builds a typed assurance graph and checks stack evidence, open gaps, external Book references, platform constraints, frontend coverage, and interactions. Bridges declared goals, approved waivers, and open obligations into the case. |
| `evaluate-case <CASE-NNN\|path>` | Evaluates lineage, admissibility, boundary coverage, capabilities, defeaters, and waivers (including expiry). Prints a human summary with per-violation fix hints on stderr; the JSON report stays on stdout. |
| `doctor` | Detects missing, mismatched, or unexpected repository-local installed skills. |

`sweep` returns `CONFORMANT_DECLARED_SCOPE` only for constructs declared in the
Book. It does not enumerate source code, prove semantic entailment, or establish
whole-repository conformance. Entailment is a recorded verifier attestation.
Only `--direction both` can return a conformance verdict; a clean one-direction
diagnostic returns `NOT_EVALUATED`.
For T2/T3 claims, validation IDs must resolve to passing entries in
`.ddd/reports/validations.yaml`. T3 refutation reports must record distinct
`refuter_id` and `implementer_id` values plus `independence_verified: true`.

The assurance commands are an experimental TypeScript/Bun slice. Unsupported
changed file classes lower boundary confidence. OpenAPI and JSON Schema files
are detected, but contract compatibility remains `not-evaluated`. The evaluator emits
`SATISFIED`, `UNSATISFIED`, `INDETERMINATE`, or `WAIVED`; only `SATISFIED` and
`WAIVED` exit zero.

## Stub primitives

These print `not yet implemented`:

`discover`, `refute`, `compile`

## Examples

```sh
# Classify a change
bun run cli/bin/ddd.ts classify "Add retry logic to the Postgres migration job"

# Lock an evidence source
bun run cli/bin/ddd.ts lock https://agentskills.io/specification \
  --source-class standard --publisher agentskills.io --version 1.0 \
  --sections "SKILL.md format" --authority skill-format --freshness 365d

# Record a claim and build a bounded evidence packet
bun run cli/bin/ddd.ts claim "SKILL.md contains YAML frontmatter" \
  --source "EL-001#SKILL.md format" --authority skill-format \
  --kind api --impact medium --entailment explicit \
  --construct "skills/example/SKILL.md#frontmatter"
bun run cli/bin/ddd.ts packet CH-001 --claims C-001 --max-chars 50000

# Add a trace from a claim to a construct
bun run cli/bin/ddd.ts trace C-001 skills/ddd-scope/SKILL.md --direction forward

# Record a validation run for a claim construct
bun run cli/bin/ddd.ts validation --claim C-001 \
  --construct "src/widget.ts#createWidget" --method test --target test/widget.test.ts

# Declare a claim as a case goal
bun run cli/bin/ddd.ts goal --claim C-001

# Accept residual risk for a goal (time-boxed waiver)
bun run cli/bin/ddd.ts exception --goal C-002 \
  --rationale "Vendor retry docs pending" --owner rom --expires 2027-03-31

# Accept residual risk for a capability nothing can evaluate (time-boxed)
bun run cli/bin/ddd.ts exception --capability consumer_impact \
  --rationale "Consumer audit deferred to Q3" --owner rom --expires 2027-09-30

# Track an unresolved defeater against an issue
bun run cli/bin/ddd.ts obligation --defeater stack:dependency:ai \
  --issue https://github.com/org/repo/issues/12

# Compliance sweep (both directions)
bun run cli/bin/ddd.ts sweep

# Freshness drift report
bun run cli/bin/ddd.ts drift-check

# Change-bounded assurance
bun run cli/bin/ddd.ts scope-change --base origin/main --head HEAD
bun run cli/bin/ddd.ts build-case ENV-001
bun run cli/bin/ddd.ts evaluate-case CASE-001

# Installed-skill drift
bun run cli/bin/ddd.ts doctor
```

## Development

```sh
cd cli && bun test
```

Layout:

```
cli/
├── bin/ddd.ts      # Entry point, command dispatch, --help
├── src/
│   ├── classify.ts # classify primitive (18-dimension taxonomy)
│   ├── lock.ts     # lock primitive (capture + cache + provenance)
│   ├── claim.ts    # claim validation and risk-tier derivation
│   ├── packet.ts   # bounded evidence packet assembly
│   ├── sweep.ts    # sweep primitive (forward/reverse compliance)
│   ├── trace.ts    # trace primitive (append trace entry)
│   ├── validation.ts      # validation writer (proof records)
│   ├── goal.ts    # goal writer (case goals)
│   ├── exception.ts       # exception writer (time-boxed waivers)
│   ├── obligation.ts      # obligation writer (defeater tracking)
│   ├── drift.ts    # drift_check primitive (freshness report)
│   ├── scope-change.ts    # Git boundary and contract detection
│   ├── build-case.ts      # Compatibility-artifact graph adapter
│   ├── coverage.ts        # Stack, gap, reference, and interaction checks
│   ├── doctor.ts          # Installed-skill diagnostics
│   ├── assurance-types.ts # Assurance graph and verdict schemas
│   ├── assurance.ts       # Policy evaluator
│   ├── stubs.ts    # not-yet-implemented primitives
│   ├── types.ts    # TypeScript types for DDD artifacts
│   └── utils.ts    # Minimal YAML parser, sha256, path/ID helpers
└── tests/
    ├── basic.test.ts
    ├── cli.test.ts
    ├── assurance.test.ts
    └── writers.test.ts
```
