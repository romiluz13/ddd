# ddd-cli

A zero-dependency Bun CLI for the implemented DDD external-documentation kernel.
The full machine API remains defined in [SPEC.md](../SPEC.md) §15.3; commands not
listed as implemented below remain explicit stubs.

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
| `lock <url>` | Requires an explicit version and a lockable source class (`vendor-doc`, `standard`, or `source-code`), captures the exact reviewed content in `.ddd/cache/`, records its digest and HTTP provenance, and appends an immutable lock entry. `--content-file` supports trusted offline retrieval. |
| `claim "<statement>"` | Records a typed claim against active locked evidence. Requires `--entailment`, validates authority, cited-section presence, cache presence, and digest integrity, and derives T0-T3 from kind and impact. |
| `packet <change_id> --claims <ids> [--max-chars <n>]` | Writes a bounded packet that references only the requested claims and their immutable cached evidence, and rejects content over the character budget. |
| `sweep [--direction forward\|reverse\|both]` | Validates Book artifact digests, declared evidence, claims, traces, derived tiers, entailment attestations, validation records, and T3 refutation metadata. Exits non-zero on violations. |
| `trace <claim_id> <construct>` | Appends a trace entry (SPEC.md §7.6.10) to `.ddd/trace-matrix.yaml` linking a claim to a construct. Validates the claim exists. Supports `--change`, `--direction`, `--validation`, `--notes`. |
| `drift-check` (alias `drift_check`, `drift`) | Freshness report over `.ddd/evidence.lock`: each active entry is `fresh` or `stale` based on `retrieved_at + freshness` vs. now. |

`sweep` returns `CONFORMANT_DECLARED_SCOPE` only for constructs declared in the
Book. It does not enumerate source code, prove semantic entailment, or establish
whole-repository conformance. Entailment is a recorded verifier attestation.
Only `--direction both` can return a conformance verdict; a clean one-direction
diagnostic returns `NOT_EVALUATED`.
For T2/T3 claims, validation IDs must resolve to passing entries in
`.ddd/reports/validations.yaml`. T3 refutation reports must record distinct
`refuter_id` and `implementer_id` values plus `independence_verified: true`.

## Stub primitives

These print `not yet implemented`:

`discover`, `refute`, `exception`, `obligation`, `compile`

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

# Compliance sweep (both directions)
bun run cli/bin/ddd.ts sweep

# Freshness drift report
bun run cli/bin/ddd.ts drift-check
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
│   ├── drift.ts    # drift_check primitive (freshness report)
│   ├── stubs.ts    # not-yet-implemented primitives
│   ├── types.ts    # TypeScript types for DDD artifacts
│   └── utils.ts    # Minimal YAML parser, sha256, path/ID helpers
└── tests/
    ├── basic.test.ts
    └── cli.test.ts
```
