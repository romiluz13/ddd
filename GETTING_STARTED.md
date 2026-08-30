# Getting Started with DDD

Docs-Driven Development (DDD) is a harness-agnostic methodology where documentation is the source of truth and code must be provable against it. This guide gets you from zero to a DDD-conformant project in 10 minutes.

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
  evidence.lock          # External source provenance (immutable)
  claims.yaml            # Atomic normative statements
  trace-matrix.yaml      # Construct → claim mappings
  constraints.yaml       # Cross-document constraints
  decisions/             # ADRs
  models/                # Domain models
  passports/             # Object design contracts
  ...
```

## Step 3: Scope your first change

Tell your agent:

> "Run the ddd-scope skill for [describe your change]."

The scope gate will:
1. Detect and record your project stack (if not already done)
2. Classify the change against the 18-dimension knowledge taxonomy
3. Enumerate dependencies and check for version-matched evidence
4. Discover evidence via doc adapters (Context7, web search, local files, etc.)
5. Lock evidence with provenance in `evidence.lock`
6. Determine your risk profile (Lite or Assurance)

**Fast paths**: If all claims are mechanical (T0), you get a lightweight scope record. If all claims are API-level (T1), you get a lightweight evidence record. Only behavioral/architectural claims (T2+) require the full pipeline.

## Step 4: Ground your implementation

Tell your agent:

> "Run the ddd-ground skill to assemble the evidence packet and extract claims."

This will:
- Assemble an evidence packet with all locked sources relevant to the change
- Extract atomic claims from sources (each claim is a single normative statement)
- Trace code constructs to claims (every construct must trace to a claim or T0 exemption)
- Extract control obligations (things that MUST be true)

## Step 5: Implement

Write code as you normally would. The evidence packet is your context. Every construct you create should trace to a claim.

## Step 6: Run the Compliance Sweep

Tell your agent:

> "Run the ddd-verify skill to check compliance."

This will:
- Run a forward sweep: every claim → traced to a construct?
- Run a reverse sweep: every construct → traces to a claim?
- Verify citation entailment: does the cited source actually say what the claim says?
- Produce a compliance report with violations, if any

If violations are found, fix them or record exceptions.

## Step 7: Handle exceptions (if needed)

If a claim can't be supported, tell your agent:

> "Run the ddd-exception skill for [describe the gap]."

Exceptions can be:
- `unknown`: no evidence found
- `ambiguous`: sources conflict
- `scope-excluded`: intentionally out of scope
- `obsolete`: source is stale

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
UNSCOPED → EVIDENCE_REQUIRED → EVIDENCE_LOCKED → GROUNDED →
  CONFORMANT → RELEASED
                ↘ WAIVED (exceptions approved)
                ↘ BLOCKED_EVIDENCE_GAP
                ↘ BLOCKED_CONTRADICTION
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

This checks 7 drift dimensions: evidence, documentation, decision, control, code, project context, and cache.

## Need more detail?

- **Full specification**: [SPEC.md](SPEC.md)
- **Skill inventory**: [SKILLS.md](SKILLS.md)
- **Agent instructions**: [AGENTS.md](AGENTS.md)
