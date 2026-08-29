# DDD — Docs-Driven Development

A harness-agnostic methodology for agentic engineering where documentation is the source of truth and code must be provable against docs.

[![skills.sh](https://skills.sh/b/ddd-methodology/ddd)](https://skills.sh/ddd-methodology/ddd)

## Install

```
npx skills add ddd-methodology/ddd
```

Or install specific skills:

```
npx skills add ddd-methodology/ddd --skill ddd --skill ddd-scope --skill ddd-verify
```

Or install all skills to a specific agent:

```
npx skills add ddd-methodology/ddd --skill '*' -a droid
```

## What is DDD?

DDD is a methodology that treats documentation as the authoritative source of truth for engineering decisions. Code must be traceable to claims, and claims must be traceable to evidence. It is:

- **Harness-agnostic** — hooks into Matt Pocock skills, Superpowers, GitHub Spec Kit, or any workflow
- **Evidence-based** — official documentation is the primary source; LLM knowledge is never evidence
- **Risk-tiered** — a two-axis model (claim kind × impact) drives verification depth (T0–T3)
- **Additive** — does not replace your harness, adds documentary accountability

## Skills

### V1 — Foundation

| Skill | Gate | Description |
|---|---|---|
| `ddd` | Router | Determines appropriate DDD operation, reports project status |
| `ddd-scope` | Evidence Scope | Classify change, discover evidence, lock with provenance |
| `ddd-book` | — | Initialize/sync/validate/release the Book, manage passports |
| `ddd-ground` | Evidence Lock → Grounding Check | Assemble packets, extract claims, trace constructs |
| `ddd-verify` | Compliance Sweep | Forward/reverse sweep, citation entailment, conformance |
| `ddd-exception` | — | Record, escalate, and resolve epistemic gaps |

### V2 — Assurance

| Skill | Gate | Description |
|---|---|---|
| `ddd-decide` | — | Grounded design tournament with weighted criteria |
| `ddd-refute` | Assurance Review | Independent adversarial review for T3 claims |

### V3 — Engineering Intelligence

| Skill | Gate | Description |
|---|---|---|
| `ddd-controls` | — | Compile obligations into executable guardrails |
| `ddd-drift` | — | Detect evidence, documentation, decision, control, and code drift |

## Skill Structure

```
skills/
├── ddd/
│   └── SKILL.md
├── ddd-scope/
│   └── SKILL.md
├── ddd-book/
│   └── SKILL.md
├── ddd-ground/
│   └── SKILL.md
├── ddd-verify/
│   └── SKILL.md
├── ddd-exception/
│   └── SKILL.md
├── ddd-decide/
│   └── SKILL.md
├── ddd-refute/
│   └── SKILL.md
├── ddd-controls/
│   └── SKILL.md
└── ddd-drift/
    └── SKILL.md
```

Each `SKILL.md` follows the [Agent Skills specification](https://agentskills.io/) with YAML frontmatter (`name`, `description`, `metadata`).

## Integration with Existing Harnesses

DDD hooks into existing workflows at defined points:

| Workflow | DDD hook points |
|---|---|
| Matt Pocock skills | `grill-with-docs` → Evidence Scope → `to-spec` → Evidence Lock → `implement` → Grounding Check → `code-review` → Compliance Sweep |
| Superpowers | Brainstorm → Evidence Scope → Spec → Evidence Lock → Plan → Grounding Check → TDD → Compliance Sweep → Review → Assurance Review |
| GitHub Spec Kit | Specify → Evidence Scope → Plan → Evidence Lock → Tasks → Grounding Check → Implement → Compliance Sweep → Converge → Assurance Review |
| CI | Compliance Sweep gate on PR; Assurance Review for T3; Drift detection on schedule |

## Machine API

Beneath the skill surface, DDD exposes stable machine operations that existing harnesses may invoke directly:

```
classify(change) → domains
discover(domains) → evidence[]
lock(evidence[]) → lock_entry
packet(change, lock) → evidence_packet
claim(statement, source) → claim_id
trace(claim_id, construct) → trace_entry
sweep(direction) → violations[]
refute(claim_id) → refutation_report
exception(claim_id, type, rationale) → exception_id
obligation(rule, source, scope) → obligation_id
compile(obligation_id, adapter) → control
drift_check() → drift_report[]
```

## Specification

The full normative specification is in [`SPEC.md`](./SPEC.md) (frozen at v0.2.6-draft). It includes:

- 20 sections + 2 annexes
- Two-axis risk model (claim_kind × impact → tier T0–T3)
- Claim-scoped authority (8-domain table)
- Lifecycle state machine (13 states, 16 transitions)
- 11 normative YAML schemas
- 9 worked examples
- Bibliographic citations with verified arXiv IDs

## Project Scaffolding

When DDD is active, a project has a `.ddd/` directory:

```
.ddd/
├── book.yaml            # Book manifest (root)
├── knowledge-map.yaml   # Domain taxonomy and gaps
├── evidence.lock        # Immutable source provenance
├── claims.yaml          # Atomic normative statements
├── trace-matrix.yaml    # Construct → claim mappings
├── decisions/           # ADRs and tournament records
├── models/              # Domain, state, threat, architecture models
├── passports/           # Object design contracts
├── obligations/         # Control obligations and compilations
├── packets/             # Evidence packets (change-specific context)
├── exceptions/          # Epistemic gap records and approvals
├── reports/             # Compliance, refutation, drift reports
└── cache/               # Content-addressed doc retrieval cache
```

## License

MIT
