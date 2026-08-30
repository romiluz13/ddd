# ddd-cli

A minimal CLI implementing the DDD (Docs-Driven Development) machine API primitives
defined in [SPEC.md](../SPEC.md) §15.3. Runs on the Bun runtime with zero npm
dependencies (uses Node-compatible `crypto`, `fetch`, and file APIs, plus a small
built-in YAML parser covering the DDD artifact subset).

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
| `lock <url>` | Fetches a URL, computes a `sha256:` content digest, and appends an immutable entry to `.ddd/evidence.lock` (schema: SPEC.md §7.3). Supports `--source-class`, `--publisher`, `--product`, `--version`, `--sections`, `--status`, `--authority`, `--freshness`, `--adapter`, `--license`, `--independence`, `--notes`. |
| `sweep [--direction forward\|reverse\|both]` | Compliance sweep over `.ddd/claims.yaml` and `.ddd/trace-matrix.yaml`. Forward: claims without sources, constructs without trace entries. Reverse: trace entries referencing unknown claims or no construct. Exits non-zero when violations are found. |
| `trace <claim_id> <construct>` | Appends a trace entry (SPEC.md §7.6.10) to `.ddd/trace-matrix.yaml` linking a claim to a construct. Validates the claim exists. Supports `--change`, `--direction`, `--validation`, `--notes`. |
| `drift-check` (alias `drift_check`, `drift`) | Freshness report over `.ddd/evidence.lock`: each active entry is `fresh` or `stale` based on `retrieved_at + freshness` vs. now. |

## Stub primitives

These print `not yet implemented`:

`discover`, `packet`, `claim`, `refute`, `exception`, `obligation`, `compile`

## Examples

```sh
# Classify a change
bun run cli/bin/ddd.ts classify "Add retry logic to the Postgres migration job"

# Lock an evidence source
bun run cli/bin/ddd.ts lock https://agentskills.io/specification \
  --source-class standard --publisher agentskills.io --freshness 365d

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
│   ├── lock.ts     # lock primitive (fetch + sha256 + append)
│   ├── sweep.ts    # sweep primitive (forward/reverse compliance)
│   ├── trace.ts    # trace primitive (append trace entry)
│   ├── drift.ts    # drift_check primitive (freshness report)
│   ├── stubs.ts    # not-yet-implemented primitives
│   ├── types.ts    # TypeScript types for DDD artifacts
│   └── utils.ts    # Minimal YAML parser, sha256, path/ID helpers
└── tests/
    └── basic.test.ts
```
