# Proofline

Proofline is a change-assurance tool for agentic software engineering. It
preserves the existing Docs-Driven Development (`ddd`) CLI as a compatibility
interface.

The supported external-evidence kernel checks declared API and protocol usage
against immutable, version-matched documentation. The experimental assurance
kernel adds a Git-derived change boundary, direct import and consumer analysis,
stack-layer coverage, typed evidence lineage, and four-valued verdicts.

## What Proofline can establish

The external kernel can establish:

> A declared API or protocol usage is supported by the cited, version-matched
> external contract under the reported checks.

The assurance kernel can establish:

> Goals inside the enumerated change boundary have admissible support under the
> reported capabilities.

Proofline does not claim repository-wide, behavioral, architectural, or
semantic correctness. TypeScript symbol discovery and OpenAPI or JSON Schema
boundary detection are experimental. Contract compatibility is not yet
evaluated, and semantic entailment remains a recorded attestation.

## Assurance workflow

```sh
# Identify changed symbols, dependencies, services, platforms, and frontend files.
bun run cli/bin/ddd.ts scope-change --base origin/main --head HEAD

# Bridge locked evidence, claims, and traces into a typed case.
bun run cli/bin/ddd.ts build-case ENV-001

# Evaluate graph integrity, admissibility, coverage, and defeaters.
bun run cli/bin/ddd.ts evaluate-case CASE-001

# Detect stale repository-local installed skills.
bun run cli/bin/ddd.ts doctor
```

The final command writes `.ddd/reports/CASE-001.assurance.json` and returns one
of:

- `SATISFIED`
- `UNSATISFIED`
- `INDETERMINATE`
- `WAIVED`

`SATISFIED` and `WAIVED` exit zero. The other verdicts exit non-zero.

## External documentation workflow

```sh
bun run cli/bin/ddd.ts lock https://vendor.example/api/v2 \
  --version 2.0.0 \
  --sections createWidget \
  --authority api-semantics

bun run cli/bin/ddd.ts claim "createWidget() returns a Widget" \
  --source "EL-001#createWidget" \
  --authority api-semantics \
  --kind api \
  --impact medium \
  --entailment explicit \
  --construct "src/widget.ts#createWidget"

bun run cli/bin/ddd.ts trace C-001 "src/widget.ts#createWidget"
bun run cli/bin/ddd.ts sweep
```

The legacy sweep returns `CONFORMANT_DECLARED_SCOPE` only for constructs named
in Book artifacts. It does not discover the repository denominator.

## Supported skills

| Skill | Purpose |
|---|---|
| `ddd` | Route the supported scope, ground, and verify workflow. |
| `ddd-scope` | Find and lock version-matched external evidence. |
| `ddd-ground` | Record claims, packets, and declared traces. |
| `ddd-verify` | Evaluate the declared external-evidence graph. |
| `ddd-book` | Initialize and validate compatibility storage. |
| `ddd-exception` | Record gaps and approvals when evidence is unavailable. |

Earlier modeling, audit, tournament, refutation, controls, and broad-drift
skills are preserved under `research/skills/`. They are not shipped as supported
capabilities.

## Storage

Proofline currently uses `.ddd/` for compatibility:

```text
.ddd/
├── book.yaml
├── evidence.lock
├── claims.yaml
├── trace-matrix.yaml
├── stack.yaml
├── knowledge-map.yaml
├── interactions.yaml
├── cases/
├── packets/
├── reports/
└── cache/
```

## Install and development

```sh
npx skills add ddd-methodology/ddd
cd cli && bun test
```

The `proofline` and `ddd` package binaries invoke the same CLI. See
[`GETTING_STARTED.md`](GETTING_STARTED.md), [`cli/README.md`](cli/README.md),
and the compact [`SPEC.md`](SPEC.md).

## Research

The superseded broad methodology is archived in
[`research/SPEC-0.3.md`](research/SPEC-0.3.md). Research material is not a claim
of implemented behavior.

## License

MIT
