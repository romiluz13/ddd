# Getting Started with DDD

Docs-Driven Development (DDD) is a harness-agnostic methodology where
documentation is the source of truth. This guide follows the implemented
external API documentation path without claiming whole-repository coverage.

## Prerequisites

- A software project with at least one source file
- A way to run an AI agent (Claude, GPT, etc.) that supports Agent Skills
- Git (recommended — DDD artifacts are designed for version control)

## Step 1: Install DDD skills

Install the DDD skill pack from skills.sh:

```bash
# If using Factory Droid or skills.sh-compatible agent:
# The skills are listed in skills.sh.json
```

Or manually clone this repo and point your agent at the `skills/` directory.

## Step 2: Initialize the Book

Tell your agent:

> "Run the ddd-book skill to initialize DDD on this project."

This will:
- Create the `.ddd/` directory with all required subdirectories
- Detect your tech stack and create `project-context.yaml`
- Create initial `book.yaml`, `knowledge-map.yaml`, `evidence.lock`, and `claims.yaml`
- Index existing project docs (ADRs, CONTEXT.md) as Book references

You should see a `.ddd/` directory appear with:

```
.ddd/
  book.yaml              # Book manifest (root)
  project-context.yaml   # Your detected tech stack
  knowledge-map.yaml     # Engineering domains relevant to your project
  evidence.lock          # Source provenance and captured-content references
  claims.yaml            # Atomic normative statements
  trace-matrix.yaml      # Construct → claim mappings
  constraints.yaml       # Cross-document constraints
  decisions/             # ADRs
  models/                # Domain models
  passports/             # Object design contracts
  ...
```

## Step 3: Scope your first external API change

Tell your agent:

> "Run the ddd-scope skill for [describe your change]."

The scope gate will:
1. Detect and record your project stack (if not already done)
2. Classify the change against the 18-dimension knowledge taxonomy
3. Enumerate dependencies and check for version-matched evidence
4. Discover version-matched vendor documentation
5. Lock the exact reviewed content with provenance in `evidence.lock` and `.ddd/cache/`
6. Determine your risk profile (Lite or Assurance)

**Fast paths**: If all claims are mechanical (T0), you get a lightweight scope record. If all claims are API-level (T1), you get a lightweight evidence record. Only behavioral/architectural claims (T2+) require the full pipeline.

You can lock a source directly with the reference CLI:

```bash
bun run cli/bin/ddd.ts lock "https://vendor.example/api/v2" \
  --version "2.0.0" \
  --sections "createWidget" \
  --authority "api-semantics"
```

External documentation requires `--version`. Use `--content-file <path>` when
the content was retrieved by a trusted adapter or when working offline.

## Step 4: Record claims and build a packet

Tell your agent:

> "Run the ddd-ground skill to assemble the evidence packet and extract claims."

This will:
- Assemble an evidence packet from the selected claims and their locked sources
- Extract atomic claims from sources (each claim is a single normative statement)
- Trace code constructs to claims (every construct must trace to a claim or T0 exemption)
- Extract control obligations (things that MUST be true)

The implemented CLI seam records an explicit entailment assessment:

```bash
bun run cli/bin/ddd.ts claim "createWidget() returns a Widget" \
  --source "EL-001#createWidget" \
  --authority "api-semantics" \
  --kind api \
  --impact medium \
  --entailment explicit \
  --construct "src/widget.ts#createWidget"

bun run cli/bin/ddd.ts packet CH-001 --claims C-001 --max-chars 50000
```

`--entailment` records the verifier's assessment. The CLI verifies that the
section label occurs in the captured content, but it does not independently
understand whether the prose semantically entails the claim.

## Step 5: Implement

Write code as you normally would. The evidence packet is your context. Every
consequential construct should trace to a claim:

```bash
bun run cli/bin/ddd.ts trace C-001 "src/widget.ts#createWidget"
```

For T2 or T3 claims, record validation IDs with `claim --validation` and
`trace --validation`. Each ID must also have a passing record in
`.ddd/reports/validations.yaml` that links back to the claim:

```yaml
schema_version: 0.1.0
entries:
  - id: V-001
    claim: C-001
    construct: src/widget.ts#createWidget
    method: test
    target: test:create-widget
    result: pass
    run_at: 2026-08-30T12:00:00Z
    evidence_hash: sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
```

## Step 6: Run the Compliance Sweep

Tell your agent:

> "Run the ddd-verify skill to check compliance."

This will:
- Run a forward sweep: every claim → traced to a construct?
- Run a reverse sweep over declared constructs and traces
- Check locked-content integrity, authority domains, cited section presence, and recorded entailment assessments
- Enforce passing validation records for T2/T3 and independent-refutation metadata for T3
- Produce a compliance report with violations, if any

The successful verdict is `CONFORMANT_DECLARED_SCOPE`. It covers only constructs
declared in Book artifacts. Repository-wide construct discovery is not yet
implemented by the CLI.

If violations are found, fix them or record exceptions through `ddd-exception`.
The `exception` machine command is currently a stub.

## Step 7: Handle exceptions (if needed)

If a claim can't be supported, tell your agent:

> "Run the ddd-exception skill for [describe the gap]."

Exceptions can be:
- `unknown`: no evidence found
- `unsupported`: the source does not support the required behavior
- `conflicting`: authoritative sources disagree
- `experimental`: runtime evidence is used with explicit risk acceptance

High-severity exceptions require human approval.

## Tiers at a glance

| Tier | What it means | Example | Evidence required |
|---|---|---|---|
| T0 | Mechanical, low impact | Type annotation, import | None (scope record only) |
| T1 | API-level, low/medium impact | Library call, config | Version-matched docs |
| T2 | Behavioral | Business logic, state machine | Authoritative primary source |
| T3 | Architectural/operational | Auth system, data migration | Primary source + adversarial review |

## Lifecycle states

```
UNSCOPED → EVIDENCE_REQUIRED → EVIDENCE_LOCKED → IMPLEMENTING →
  VERIFYING → CONFORMANT
                 ↘ WAIVED
                 ↘ BLOCKED_EVIDENCE_GAP
                 ↘ BLOCKED_CONTRADICTION
                 ↘ NONCONFORMANT → IMPLEMENTING
```

## Common workflows

### Adding a new dependency

1. `ddd-scope` detects the new dependency during Step 2 (dependency enumeration)
2. Evidence is acquired for the installed version
3. Cross-document constraints are checked (e.g., does it conflict with your runtime?)
4. Implementation proceeds with version-matched evidence

### Brownfield adoption

Tell your agent:

> "Run the ddd-audit skill to audit the existing codebase."

This will scan existing code, extract implicit claims, match them to available docs, flag gaps, and produce a draft Book. You then prioritize remediation.

### Detecting drift

After upgrading dependencies or changing frameworks:

> "Run the ddd-drift skill to check for drift."

The methodology defines seven drift dimensions. The current CLI
`drift-check` command checks evidence freshness only; the `ddd-drift` skill
coordinates the broader agent-assisted review.

## Need more detail?

- **Full specification**: [SPEC.md](SPEC.md)
- **Skill inventory**: [SKILLS.md](SKILLS.md)
- **Agent instructions**: [AGENTS.md](AGENTS.md)
