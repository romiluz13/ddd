# DDD — Docs-Driven Development

A harness-agnostic methodology for agentic engineering where documentation is the source of truth and code must be provable against docs.

## Status

- **Spec version**: 0.3.1-draft (implementable)
- **Skills**: 12 skills across 3 maturity versions (V1: 8, V2: 2, V3: 2)
- **Scaffolding**: `.ddd/` directory with template files
- **CLI**: `cli/` directory with machine API primitives (TypeScript/Bun)

## Structure

```
DDD/
├── SPEC.md              # Normative specification (v0.3.1-draft)
├── CONTEXT.md           # Project glossary and context
├── AGENTS.md            # This file — agent runtime instructions
├── README.md            # Package README for skills.sh
├── GETTING_STARTED.md   # Quick start guide (10-minute walkthrough)
├── SKILLS.md            # Skills manifest (version/gate/API mapping)
├── LICENSE              # MIT license
├── skills.sh.json       # skills.sh registry grouping
├── skills/              # DDD skill definitions (Agent Skills format)
│   ├── ddd/             # Router (V1)
│   ├── ddd-scope/       # Evidence Scope gate (V1)
│   ├── ddd-book/        # Book management + project context (V1)
│   ├── ddd-ground/      # Evidence Lock gate (V1)
│   ├── ddd-verify/      # Compliance Sweep gate (V1)
│   ├── ddd-exception/   # Exception management + claim retraction (V1)
│   ├── ddd-model/       # Domain modeling (V1)
│   ├── ddd-audit/       # Brownfield code audit (V1)
│   ├── ddd-decide/      # Design tournament (V2)
│   ├── ddd-refute/      # Adversarial review (V2)
│   ├── ddd-controls/    # Control compilation (V3)
│   └── ddd-drift/       # Drift detection (V3)
│   (skills use references/ for progressive disclosure where needed)
├── cli/                 # Machine API CLI (TypeScript/Bun)
└── .ddd/                # Project engineering book (runtime state)
    ├── book.yaml        # Book manifest (root)
    ├── project-context.yaml  # Detected tech stack, runtime, deps
    ├── knowledge-map.yaml    # Domain taxonomy and gaps
    ├── evidence.lock    # Immutable source provenance
    ├── claims.yaml      # Atomic normative statements
    ├── trace-matrix.yaml   # Construct → claim mappings
    ├── constraints.yaml # Cross-document constraints
    ├── decisions/       # ADRs and tournament records
    ├── models/          # Domain, state, threat, architecture models
    ├── passports/       # Object design contracts
    ├── obligations/     # Control obligations and compilations
    ├── packets/         # Evidence packets (change-specific context)
    ├── exceptions/      # Epistemic gap records and approvals
    ├── reports/         # Compliance, refutation, drift reports
    └── cache/           # Content-addressed doc retrieval cache
```

## For agents working in this project

1. **Read SPEC.md** for the normative specification. All skills derive from it.
2. **Check `.ddd/book.yaml`** to determine if DDD is active and what profile is in use.
3. **Check `.ddd/project-context.yaml`** for the detected tech stack.
4. **Use the `ddd` router skill** to determine which DDD operation to perform.
5. **All artifacts in `.ddd/` are governed by the spec** — do not modify schemas without updating SPEC.md.

## Integration with existing harnesses

DDD is additive. It hooks into existing workflows (Matt Pocock skills, Superpowers, GitHub Spec Kit) at defined points:

| Workflow | DDD hook points |
|---|---|
| Matt Pocock skills | `grill-with-docs` → Evidence Scope → `to-spec` → Evidence Lock → `implement` → Grounding Check → `code-review` → Compliance Sweep |
| Superpowers | Brainstorm → Evidence Scope → Spec → Evidence Lock → Plan → Grounding Check → TDD → Compliance Sweep → Review → Assurance Review |
| GitHub Spec Kit | Specify → Evidence Scope → Plan → Evidence Lock → Tasks → Grounding Check → Implement → Compliance Sweep → Converge → Assurance Review |
| CI | Compliance Sweep gate on PR; Assurance Review for T3; Drift detection on schedule |

## Machine API

Beneath the skill surface, DDD exposes stable machine operations (SPEC.md §15.3):

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

Existing harnesses MAY invoke these primitives directly without using DDD skills.
