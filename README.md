# DDD — Docs-Driven Development

A harness-agnostic methodology for agentic engineering where documentation is the source of truth and code must be provable against docs.

[![skills.sh](https://skills.sh/b/ddd-methodology/ddd)](https://skills.sh/ddd-methodology/ddd)

## The problem

You ask an AI agent to add a feature. It writes code. Does the code match the docs? Does it use the right API version? Did it hallucinate a method that doesn't exist? You don't know, and neither does the agent.

**Agents hallucinate APIs.** They mix versions. They use parametric memory (stale training data) instead of current documentation. They write code that looks right but isn't provable against any source of truth.

**Existing approaches don't close the loop.** You can write a spec, but nothing verifies the code against it. You can run tests, but tests don't check if you're using the library API correctly. You can do code review, but reviewers can't check every library call against the docs.

**The result**: code that works by coincidence, not by proof. Bugs hide in the gap between what the docs say and what the code does.

## The solution

DDD makes documentation the source of truth and builds traceability between code
and docs. The first supported workflow is deliberately narrow: prevent external
API hallucinations by pinning the documentation version and preserving the exact
content an agent reviewed. The methodology also defines internal-artifact
governance, but that discovery remains agent-assisted rather than CLI-enforced.

1. **Evidence is locked** — DDD requires an explicit external-doc version,
   hashes the retrieved content, and stores that content in `.ddd/cache/`.
2. **Claims are recorded** — an agent records an atomic statement, its cited
   section, authority domain, risk inputs, and entailment assessment.
3. **Packets stay bounded** — a change-specific packet references only selected
   claims and immutable cached evidence.
4. **Constructs are traced** — implementation symbols link to the claims they use.
5. **Compliance is qualified** — the CLI checks the declared graph and reports
   `CONFORMANT_DECLARED_SCOPE`, never whole-repository conformance.

```
documentation → evidence lock → claims → traces → code → compliance sweep
                    ↑                                    ↓
                    └──────────── drift detection ────────┘
```

## A concrete example

Your Next.js app needs to call an external API. The agent says "use `fetch()` with `cache: 'no-store'`."

**Without DDD**: The agent writes the code. Maybe it works. Maybe `cache: 'no-store'` isn't the right option for your Next.js version. You won't find out until production.

**With DDD**:

1. **`ddd-scope`** classifies the change: domains include `http-client`, `nextjs-data-fetching`. It detects your Next.js version (15.1.0) from `package.json`. It acquires the Next.js fetch documentation for that version and locks it in `evidence.lock`.

2. **`ddd-ground`** extracts claims from the locked docs:
   - Claim CL-001: "Next.js extends the native fetch API with caching options" (T2, behavioral)
   - Claim CL-002: "`cache: 'no-store'` disables caching for that fetch call" (T1, API-level)
   - It traces the agent's `fetch()` call to CL-002.

3. **`ddd-verify`** runs the compliance sweep:
   - Forward: CL-001 → implemented? Yes (fetch call present)
   - Reverse: `fetch()` call → traced to claim? Yes (CL-002)
   - Citation entailment: Does the locked Next.js doc actually say `cache: 'no-store'` disables caching? Yes, confirmed.
   - Result: `CONFORMANT_DECLARED_SCOPE`

4. During changed-code enumeration, an agent maps the actual cache option to the
   claim. If it finds `cache: 'no-cache'` instead, the change remains
   nonconformant until the code is fixed or an exception is approved. The CLI
   validates the resulting declared graph; it does not discover the call itself.

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

## Quick start

See [GETTING_STARTED.md](./GETTING_STARTED.md) for the external API documentation workflow.

## Skills

### V1 — Foundation

| Skill | Gate | Description |
|---|---|---|
| `ddd` | Router | Determines appropriate DDD operation, routes to fast paths, reports project status with stack summary |
| `ddd-scope` | Evidence Scope | Detect stack, classify change, enumerate dependencies, discover evidence, lock external docs with provenance |
| `ddd-book` | — | Initialize/sync/validate/release the Book (greenfield or brownfield), detect project context, manage passports |
| `ddd-ground` | Evidence Lock → Grounding Check | Assemble packets, extract claims, trace constructs, extract obligations |
| `ddd-verify` | Compliance Sweep | Forward/reverse sweep, citation entailment verification, test-code traceability, conformance |
| `ddd-exception` | — | Record, escalate, resolve epistemic gaps, retract false claims |
| `ddd-model` | — | Domain modeling: state machines, aggregates, entities, threat models, architecture models |
| `ddd-audit` | — | Brownfield code audit: scan code, extract claims, match to docs, produce draft Book |

### V2 — Assurance

| Skill | Gate | Description |
|---|---|---|
| `ddd-decide` | — | Grounded design tournament with weighted criteria |
| `ddd-refute` | Assurance Review | Independent adversarial review for T3 claims, citation entailment challenge |

### V3 — Engineering Intelligence

| Skill | Gate | Description |
|---|---|---|
| `ddd-controls` | — | Compile obligations into executable guardrails |
| `ddd-drift` | — | Detect 7 drift dimensions: evidence, documentation, decision, control, code, project context, cache |

## Risk tiers

| Tier | What it means | Example | Evidence required |
|---|---|---|---|
| T0 | Mechanical, low impact | Type annotation, import | None (scope record only) |
| T1 | API-level, low/medium impact | Library call, config value | Version-matched docs |
| T2 | Behavioral | Business logic, state machine | Authoritative primary source |
| T3 | Architectural/operational | Auth system, data migration | Primary source + adversarial review |

## Fast paths

Not every change needs the full pipeline:

- **T0-only**: All claims are mechanical. A scope record is sufficient, no evidence lock needed.
- **T1 fast path**: All claims are API-level. A lightweight evidence record with version-matched docs per API is sufficient.
- **T2+**: Any behavioral, architectural, or operational claim triggers the full pipeline.

## Integration with Existing Harnesses

DDD hooks into existing workflows at defined points:

| Workflow | DDD hook points |
|---|---|
| Matt Pocock skills | `grill-with-docs` → Evidence Scope → `to-spec` → Evidence Lock → `implement` → Grounding Check → `code-review` → Compliance Sweep |
| Superpowers | Brainstorm → Evidence Scope → Spec → Evidence Lock → Plan → Grounding Check → TDD → Compliance Sweep → Review → Assurance Review |
| GitHub Spec Kit | Specify → Evidence Scope → Plan → Evidence Lock → Tasks → Grounding Check → Implement → Compliance Sweep → Converge → Assurance Review |
| CI | Compliance Sweep gate on PR; Assurance Review for T3; Drift detection on schedule |

## Machine API

The specification defines a larger machine API. The reference CLI implements the
small external-doc kernel today:

| Primitive | Status |
|---|---|
| `classify`, `lock`, `claim`, `packet`, `trace`, `sweep` | Implemented |
| `drift-check` | Evidence freshness only |
| `discover`, `refute`, `exception`, `obligation`, `compile` | Explicit stubs |

`sweep` validates Book artifact digests, locked-content integrity, citation
metadata and recorded entailment, authority domains, declared construct traces,
and T2/T3 requirements.
Its reverse sweep is limited to constructs declared in Book artifacts; it does
not scan the repository for undocumented behavior.

See the exact flags and limitations in [`cli/README.md`](./cli/README.md).

## Specification

The full normative specification is in [`SPEC.md`](./SPEC.md) (v0.3.2-draft). It includes:

- 20 sections + 2 annexes
- Two-axis risk model (claim_kind × impact → tier T0–T3)
- Claim-scoped authority (8-domain table)
- 18-dimension knowledge taxonomy with extension process
- **Internal artifact discovery** — 15 groups, 40+ classes with per-language detection patterns (§9.12)
- **Greenfield vs brownfield** initialization paths (§4.3)
- **Living Book principle** — docs evolve with code (§3.7)
- Stack detection and dependency enumeration procedures
- Lifecycle state machine (10 states, 17 transitions)
- 13 normative YAML schemas (including project context with artifact inventory, domain model, cross-document constraints)
- 7 drift dimensions
- Monorepo scoping (federated, per-package, hybrid)
- Incident/postmortem feedback loop
- Bibliographic citations with verified arXiv IDs

## Project Scaffolding

When DDD is active, a project has a `.ddd/` directory:

```
.ddd/
├── book.yaml              # Book manifest (root)
├── project-context.yaml   # Detected tech stack, runtime, dependencies
├── knowledge-map.yaml     # Domain taxonomy, gaps, package links
├── evidence.lock          # Immutable source provenance
├── claims.yaml            # Atomic normative statements
├── trace-matrix.yaml      # Construct → claim mappings
├── constraints.yaml       # Cross-document constraints
├── decisions/             # ADRs and tournament records
├── models/                # Domain, state, threat, architecture models
├── passports/             # Object design contracts
├── obligations/           # Control obligations and compilations
├── packets/               # Evidence packets (change-specific context)
├── exceptions/            # Epistemic gap records and approvals
├── reports/               # Compliance, refutation, drift reports
└── cache/                 # Content-addressed doc retrieval cache
```

## License

MIT
