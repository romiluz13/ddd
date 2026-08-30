# DDD: Docs-Driven Development for Agentic Engineering

**Version:** 0.3.0-draft
**Status:** Draft for review
**Date:** 2026-08-30
**Machine identifier:** `docs-driven-development`

> *Not to be confused with Domain-Driven Design (Eric Evans, 2003). When both concepts appear in the same context, write "Docs-Driven Development" and "Domain-Driven Design" in full.*

**Tagline:** Documentation as the engineering intelligence plane.

---

## 1. Purpose, Scope, and Non-goals

### 1.1 Purpose

DDD is a methodology for agentic software engineering in which approved, versioned documentation drives the engineering process: knowledge discovery, method selection, system design, object responsibilities, executable constraints, implementation context, and verification.

LLMs have knowledge cutoffs and hallucinate APIs at measurable rates (GPT-4o: 38.58% valid on low-frequency APIs; 19.7% of generated package references are hallucinated; see Annex B for full citations). DDD addresses this by treating documentation as the authority, not the model's parametric memory. Documentation is ingested before coding, code is written against it, and code is validated against it afterward.

DDD is not "RAG before coding." It is an engineering intelligence system that converts the world's best available documented engineering knowledge into an executable, continuously verified, project-specific engineering constitution.

### 1.2 Scope

DDD governs:

- Knowledge discovery and acquisition
- The Project Engineering Book (the project's engineering constitution)
- Evidence-backed design decisions
- Object passports for responsibility-bearing design units
- Control obligations compiled into executable guardrails
- Bidirectional traceability between documentation and code
- Adversarial verification of high-risk conclusions
- Drift detection between evidence, documentation, decisions, controls, and code
- Epistemic gap management (unknowns, conflicts, exceptions)

### 1.3 Non-goals

DDD does **not** own:

- Product ideation or user interviews
- Specification authoring (product specs)
- Task/ticket decomposition
- TDD red-green-refactor loops
- Subagent coordination or orchestration
- Implementation execution
- General code review
- Completion verification

These remain the responsibility of existing workflows (Superpowers, Matt Pocock skills, GitHub Spec Kit, etc.). DDD enriches their artifacts and enforces engineering semantics at lifecycle hook points.

### 1.4 The additive principle

DDD is **comprehensive vertically** (knowledge discovery → design → controls → evidence → drift detection) and **additive horizontally** (existing workflows keep owning their phases; DDD hooks in at lifecycle events).

```
Existing workflow:  interview → spec → plan → implement → review
                          ↑        ↑       ↑          ↑        ↑
DDD intelligence:  classify  ground  decide  constrain  verify
                   └────────── hooks and adapters ──────────────┘
```

DDD MAY ship a reference end-to-end workflow, but DDD conformance MUST NOT require using it.

---

## 2. Terminology and Normative Language

### 2.1 Normative keywords

- **MUST**: required for conformance
- **MUST NOT**: prohibited
- **SHOULD**: expected unless justified and recorded
- **SHOULD NOT**: avoided unless justified and recorded
- **MAY**: optional

### 2.2 Key terms

| Term | Definition |
|---|---|
| **Project Engineering Book** | The federated, versioned set of authoritative engineering artifacts for a project. Not a single document. |
| **Knowledge Map** | A persistent record of which engineering knowledge domains are relevant to the project, with applicability hypotheses and gaps. |
| **Evidence Lock** | An immutable, content-addressed record of acquired external sources with full provenance. |
| **Claim** | An atomic, normative statement extracted from a source, requiring support. |
| **Construct** | A code element (class, function, module, boundary, data model) that implements a claim. |
| **Validation** | An executable check (test, type check, lint rule, contract test, runtime probe) that verifies a construct satisfies a claim. |
| **Object Passport** | A durable design contract for a responsibility-bearing engineering unit: purpose, domain concept, responsibilities, invariants, lifecycle, collaborators, dependencies, methodology, risks, and validating tests. |
| **Evidence Packet** | A bounded, change-specific context bundle containing the claims, evidence, passports, and controls relevant to one implementation task. |
| **Control Obligation** | A target-agnostic, machine-readable rule extracted from documentation, to be compiled into an executable guardrail. |
| **Epistemic Gap** | A known unknown, conflict, or unsupported state that is explicitly surfaced, classified, and handled. |
| **Consequential Claim** | A claim whose failure would affect externally observable behavior, architectural integrity, security, data integrity, or operational correctness. |

---

## 3. Principles

### 3.1 Minimum sufficient authority and best-fit simplicity

The smallest authoritative corpus that resolves the consequential decisions and proof obligations appropriate to the change's risk level.

This does not mean the fewest citations. It means the smallest *sufficient* set. DDD MUST also challenge unnecessary patterns, abstractions, controls, and documentation. State of the art means best-fit, evidence-backed simplicity, not maximal cleverness or pattern soup.

### 3.2 Best available, authoritative, applicable, version-matched, and legally retrievable knowledge

Each adjective prevents a distinct failure:

- **Best available**: no claim of omniscient discovery
- **Authoritative**: excludes popularity as proof
- **Applicable**: prevents pattern accumulation
- **Version-matched**: prevents technically correct but unusable guidance
- **Legally retrievable**: prevents illicit or unreproducible evidence acquisition

The Book MUST record the search scope so "best available" is auditable rather than rhetorical.

### 3.3 Controlled epistemic gaps, not omniscience

DDD promises controlled epistemic gaps, not omniscience. The following are legitimate visible states:

- **Known and supported** — claim has evidence and validation
- **Known but conflicting** — sources disagree, conflict is surfaced
- **Unknown** — no evidence found, gap is recorded
- **Unsupported** — evidence found but insufficient
- **Experimentally observed** — runtime behavior documented but not officially supported
- **Human-approved exception** — gap accepted by a human with rationale
- **Blocked pending evidence** — gap blocks progress until resolved

**Fabricated certainty, disguised assumptions, and citation laundering are conformance failures.**

### 3.4 Zero trust in parametric model memory

Model parametric memory is **discovery only, never evidence**. An agent may use its training knowledge to identify *what to look for*, but every consequential code decision MUST trace to acquired, versioned, authoritative documentation or an approved exception.

### 3.5 Documentation drives, evidence verifies

Documentation drives design and implementation. Tests, static analysis, runtime checks, and formal methods verify that the implementation conforms. DDD provides evidence-backed compliance, not mathematical proof.

### 3.6 Additive, not replacement

DDD enriches existing workflows. It does not replace them. Conformance does not require adopting a DDD-owned lifecycle.

---

## 4. Architecture

### 4.1 Engineering intelligence plane

DDD operates as an engineering intelligence plane that existing workflows call into at lifecycle events. The plane provides shared services:

1. Problem classification
2. Knowledge discovery
3. Project Engineering Book management
4. Evidence and decision graph
5. Design evaluation (tournament)
6. Control obligations
7. Evidence packets
8. Reverse traceability
9. Drift detection

### 4.2 Mandatory kernel

Every DDD-conformant project MUST have:

- A Book manifest
- An evidence policy and evidence lock
- Claims, constructs, and validation links
- Bounded evidence packets for each change **or a valid T0-only scope record** (§4.2.1)
- A reverse sweep capability
- Explicit epistemic gaps

The following are **risk-triggered**, not mandatory for every change:

- Design tournament (only for consequential, uncertain, or hard-to-reverse decisions)
- Object passports (only for responsibility-bearing units)
- Independent refutation (only for T3 critical claims)
- Compiled executable controls (only when a trusted adapter exists)

This ensures DDD provides value immediately without requiring the full system to exist.

### 4.2.1 Enforcement modes

For V1, each gate and check MAY operate in one of three enforcement modes:

| Mode | Description |
|---|---|
| `manual` | Human performs the check; DDD provides the checklist and artifact template |
| `agent-assisted` | Agent performs the check and reports results; human reviews the report |
| `tool-enforced` | Automated tool performs the check; failures block progression |

Each check records its enforcement mode and confidence level. V1 SHOULD NOT imply that semantic completeness can be proven automatically. `manual` and `agent-assisted` modes record coverage and confidence; only `tool-enforced` mode provides a machine-verified pass/fail.

**T0-only changes**: a change that touches only code whose claims all derive to T0 after classification (§13.2) — meaning `mechanical` kind with `low` impact — MAY produce a minimal scope record instead of a full evidence packet. The scope record identifies the change boundary and states "T0-only, no consequential claims." If classification reveals any claim above T0, a full evidence packet is required.

### 4.2.2 T1 fast path

A change that touches only code whose claims all derive to T1 (API-level: imports, configuration, framework conventions, library usage with `low` or `medium` impact) MAY use a **lightweight evidence record** instead of a full evidence packet. The lightweight record:

- Identifies the change boundary and all affected API surfaces
- Lists each API/library used with its version-matched evidence lock entry (or creates one)
- Records the classification (claim_kind: `api`, impact, derived tier: T1)
- Does NOT require passports, design tournament, or control obligations
- Requires symbol-level traceability (each usage mapped to versioned evidence) per §13.2 T1 requirements

If classification reveals any claim above T1, a full evidence packet is required. The lightweight record is a simplified form of the change record (§7.6.1) with `profile: lite` and `t1_fast_path: true`.

### 4.3 State sharing

All DDD skills and operations share durable project state in the `.ddd/` directory. Skills are independently invocable but operate on the same Book, evidence lock, claim ledger, and trace graph. A stable machine API beneath skills allows existing harnesses to invoke individual primitives programmatically.

---

## 5. Trust and Evidence Policy

### 5.1 Claim-scoped authority

There is no universal total ordering of sources. Authority is determined by the **claim domain** — what the claim is about. When sources conflict, the authority for the disputed claim domain prevails.

| Claim domain | Primary authority | Secondary authority |
|---|---|---|
| Product behavior | Approved requirements | Domain authority, project ADRs |
| Domain rules | Domain authority and approved project models | Approved requirements |
| API semantics | Version-matched vendor documentation | Official types, schemas, test suites |
| Protocol behavior | Applicable normative standard (RFC, W3C) | Vendor documentation |
| Project architecture | Approved ADRs and architecture constitution | Vendor docs, framework conventions |
| Observed runtime behavior | Reproducible experiment | Official documentation (as intent, not observed behavior) |
| Security and compliance | Applicable standard (OWASP, NIST) or regulatory requirement | Vendor docs, project ADRs |
| Cross-document constraints | Combination of authoritative sources for each constrained domain | Project ADRs (recording the constraint) |
| Dependency version conflicts | Package registry metadata (npm, PyPI, crates.io) and peerDependency declarations | Vendor docs, compatibility matrices |
| Accepted unsupported behavior | Waiver (explicitly not evidence) | N/A — waiver authorizes risk acceptance |

**Key principles:**

- A project requirement outranks vendor docs for *desired product behavior*.
- Vendor docs outrank an ADR for *API semantics*.
- Runtime experiments establish *observed behavior*, not *supported behavior*. They record a discrepancy, not an override.
- OWASP guidance is normative only for security/compliance claims, not universally.
- A human waiver is authorization to accept risk, not evidence of correctness.
- Model parametric memory is **discovery only, never evidence**, regardless of claim domain.

A conflict between sources of the same authority level for the same claim domain MUST trigger escalation, not silent override.

### 5.2 Provenance

Every evidence source MUST record provenance. Required fields vary by **source class**:

| Source class | Examples |
|---|---|
| `vendor-doc` | Official framework/library documentation, API reference |
| `standard` | RFC, W3C, OWASP, NIST |
| `project-doc` | Requirements, ADRs, architecture docs, domain models |
| `source-code` | Official types, schemas, test suites, package source |
| `code-derived` | Artifacts derived from the project's own code: generated types, inferred schemas, OpenAPI specs, DB migrations, build output |
| `experiment` | Reproducible runtime experiment |
| `waiver` | Human-approved risk acceptance (not evidence) |

**Required fields by source class** (✓ = required, ○ = optional, — = not applicable):

| Field | `vendor-doc` | `standard` | `project-doc` | `source-code` | `code-derived` | `experiment` | `waiver` |
|---|---|---|---|---|---|---|---|
| `id` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `source_class` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `source_url` | ✓ | ✓ | ○ | ✓ | — | — | — |
| `repository_path` | ○ | — | ✓ | ✓ | ✓ | — | — |
| `publisher` | ✓ | ✓ | — | ○ | — | — | — |
| `product` | ✓ | — | — | ✓ | — | — | — |
| `version` | ✓ | ✓ | — | ✓ | — | — | — |
| `doc_version` | ✓ | ○ | ✓ | ✓ | ✓ | — | — |
| `retrieved_at` | ✓ | ✓ | — | ✓ | ✓ | — | — |
| `content_digest` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| `sections` | ✓ | ✓ | ✓ | ○ | ○ | — | — |
| `status` (normative/informative) | ✓ | ✓ | ○ | — | — | — | — |
| `authority_for` (claim domains) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| `freshness` | ✓ | ○ | — | ○ | — | — | — |
| `adapter` | ✓ | ✓ | — | ○ | — | — | — |
| `license` | ✓ | ✓ | — | ✓ | — | — | — |
| `independence` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `approved_by` | — | — | ✓ (if agent-proposed) | — | — | — | ✓ |
| `approval_rationale` | — | — | ✓ (if agent-proposed) | — | — | — | ✓ |
| `experiment_steps` | — | — | — | — | — | ✓ | — |
| `experiment_result_hash` | — | — | — | — | — | ✓ | — |

### 5.3 Independence levels

Every L0 source carries an `independence` field:

| Level | Description | Counts as evidence? |
|---|---|---|
| `external` | Vendor docs, standards, published books | Yes |
| `human-authored` | Human-written project docs, requirements | Yes |
| `agent-proposed-human-approved` | Agent authored, human approved | Yes |
| `agent-authored-unapproved` | Agent authored, not yet approved | No — proposal only |

An agent MUST NOT cite its own unapproved document as evidence. This prevents circular self-justification.

### 5.4 Freshness

Each source has a freshness policy specifying:

- How long the cached content remains valid
- Whether re-verification is required on each use
- What constitutes a breaking change (hash mismatch, version change, URL disappearance)

A citation without captured content and digest is not durable traceability. For sources that have version identifiers (vendor-doc, standard, source-code), version MUST be captured. For project-doc sources, `repository_path` and `doc_version` (commit hash) serve as the version record. For experiment sources, `experiment_result_hash` serves as the version record.

### 5.5 Conflict resolution

When sources disagree:

1. Identify the claim domain (§5.1) and determine the primary authority for that domain.
2. The primary authority prevails. If the conflict is between same-authority sources within the same domain, surface it as a `BLOCKED_CONTRADICTION`.
3. If the conflict is between documentation and runtime behavior: runtime observation does **not override** documentation. It records a discrepancy. The observation MAY justify an experimental implementation under human approval, with an explicit exception recording that the implementation follows observed behavior, not supported behavior.
4. The conflict and its resolution MUST be recorded in the exception ledger.

### 5.6 Security handling

Retrieved documentation is **untrusted data**, never agent instructions. DDD MUST enforce containment, not merely detection:

- Retrieved content MUST remain in a **data-only trust boundary** — it is quoted evidence, not directives
- Retrieved instructions (e.g., "install this package", "run this command") MUST NOT alter agent policy or tool authority
- Code snippets in documentation MUST NOT execute without an explicit sandbox policy
- Imperative prose in docs MUST NOT be treated as agent directives
- Detection of prompt-injection attempts MAY supplement containment but is not a substitute for it

**Sensitive document handling:**

- Internal documents containing secrets, credentials, or PII MUST be redacted before entering the evidence lock
- Retention policies SHOULD specify how long cached documents are kept
- Documents MUST NOT be transmitted to external providers without an explicit data-sharing policy
- Secret exclusion: API keys, tokens, and credentials MUST NOT appear in evidence lock entries, claim text, or evidence packets

---

## 6. Roles and Governance

### 6.1 Roles

DDD defines the following roles. Multiple roles MAY be performed by the same agent except where prohibited (6.2).

| Role | Responsibility |
|---|---|
| **Knowledge Curator** | Discovers, acquires, and maintains authoritative sources |
| **Designer** | Proposes designs grounded in evidence |
| **Implementer** | Writes code against evidence packets |
| **Evidence Validator** | Verifies that claims are supported by cited sources |
| **Refuter** | Adversarially challenges high-risk conclusions |
| **Human Approver** | Approves high-impact decisions, exceptions, and unapproved docs |

### 6.2 Prohibited role combinations for T3 work

For T3 (critical) claims:

- The Implementer MUST NOT be the sole Evidence Validator
- The Designer MUST NOT be the sole Refuter
- Agent-authored-unapproved documents MUST NOT serve as evidence without Human Approver sign-off

---

## 7. Artifacts

### 7.1 Directory structure

```
.ddd/
  book.yaml              # Manifest, versions, claim-scoped authority
  project-context.yaml   # Governed tech stack, runtime, dependencies, architecture
  knowledge-map.yaml     # Relevant engineering domains, gaps, and package links
  evidence.lock          # Immutable external-source provenance
  claims.yaml            # Claim ledger (atomic assertions)
  trace-matrix.yaml      # Generated view of the evidence graph
  constraints.yaml       # Cross-document join constraints
  decisions/             # DDD decisions where existing ADRs don't exist
  models/                # Domain, state, threat, and architecture models
  passports/             # Object/design-unit passports
  obligations/           # Machine-readable control obligations
  packets/               # Change-specific evidence packets
  exceptions/            # Approved gaps and waivers
  reports/               # Compliance, refutation, and drift reports
  cache/                 # Rebuildable retrieval cache (normally gitignored)
```

### 7.2 Book manifest (`book.yaml`)

The manifest is the root of the Book. It indexes existing project artifacts without copying them:

```yaml
schema_version: 0.1.0
version: 0.1.0
released_at: 2026-08-29T12:00:00Z
manifest_digest: sha256:...

requirements:
  - path: docs/product/checkout.md
    authority: product-approved
    independence: human-authored

decisions:
  - path: docs/adr/004-payment-boundary.md
    authority: team-approved
    independence: human-authored

agent_context:
  - path: CONTEXT.md
    status: working-document
    independence: agent-proposed-human-approved

evidence_lock: evidence.lock
knowledge_map: knowledge-map.yaml
claims: claims.yaml
project_context: project-context.yaml
constraints: constraints.yaml
```

A released Book version is identifiable by its manifest and content digests. A code revision MAY declare which Book version governed it.

### 7.3 Evidence lock (`evidence.lock`)

Immutable, content-addressed, and append-only. Existing entries are never modified in place; the active lock set is updated by adding or superseding entries. Each entry:

```yaml
schema_version: 0.1.0
entries:
  - id: EL-001
    source_class: vendor-doc
    source_url: https://nextjs.org/docs/app/router-context
    publisher: Vercel
    product: Next.js
    version: 15.1.0
    retrieved_at: 2026-08-29T10:00:00Z
    content_digest: sha256:abc123...
    doc_version: commit:def456...
    sections: ["Server Components", "Route Handlers"]
    status: normative
    authority_for: [api-semantics, protocol-behavior]
    freshness: 90d
    adapter: context7
    license: MIT
    independence: external
```

### 7.4 Claim ledger (`claims.yaml`)

Atomic assertions requiring support. Each claim:

```yaml
schema_version: 0.1.0
entries:
  - id: C-042
    statement: "Server components cannot use browser-only APIs"
    rationale: "ADR-007: Server components render on the server, browser APIs are unavailable"
    sources:
      - ref: EL-001#Server Components
        authority_domain: api-semantics
    claim_kind: api
    impact: medium
    tier: T1  # derived: api raises to at least T1, medium impact minimum is T1
    status: known-and-supported
    constructs: [OrderList.component, ProductCard.component]
    validations: [test:server-component-no-window, lint:no-browser-apis-in-server]
```

### 7.5 Evidence packet

A bounded, change-specific context bundle:

```yaml
schema_version: 0.1.0
id: PKT-001
change: "Add order cancellation feature"
claims: [C-042, C-017, C-055]
evidence: [EL-001, EL-003, EL-008]
passports: [order.aggregate]
obligations: [order.no-direct-payment-gateway]
invariants: ["Order can only be cancelled if status is PENDING or CONFIRMED"]
forbidden: ["Cancelling a SHIPPED order", "Bypassing the Order aggregate to modify line items"]
validations_required: [test:cancel-pending, test:cancel-confirmed-passes, test:cancel-shipped-rejected]
context_budget:
  max_tokens: 50000
  sections_selected: 12
  conflicts_included: 1
assembled_at: 2026-08-29T10:00:00Z
packet_digest: sha256:...
```

Evidence packets prevent context rot by delivering only the relevant slice of the Book to the implementer.

### 7.6 Normative artifact schemas

All DDD artifacts share these conventions:

- **Schema version**: every artifact file begins with `schema_version: 0.1.0`
- **Stable IDs**: format `<prefix>-<sequential>` (e.g., `EL-001`, `C-042`, `EX-007`)
- **Timestamps**: ISO 8601 with timezone (e.g., `2026-08-29T10:00:00Z`)
- **Supersession**: an entry with `superseded_by: EL-002` is no longer active; the superseding entry has `supersedes: EL-001`
- **Revocation**: an entry with `revoked: true` and `revoked_at` is invalid and MUST NOT be cited
- **Artifact digest**: released Book manifests and evidence lock entries MUST carry a content digest for integrity verification; other artifacts MAY carry a digest. The digest field name is artifact-specific: `manifest_digest` for the Book manifest, `content_digest` for evidence lock entries, `packet_digest` for evidence packets. All are `sha256:...` format.
- **Invalid state**: an entry with `revoked: true` that is still cited in a claim is a conformance failure

#### 7.6.1 Change record

```yaml
schema_version: 0.1.0
id: CH-001
title: "Add order cancellation feature"
base_revision: commit:abc123...
head_revision: commit:def456...
changed_symbols:
  - src/domain/order/Order.ts#cancelOrder
  - src/domain/order/OrderStateMachine.ts
new_dependencies:
  - "domain-events@2.1.0"
affected_constructs:
  - OrderList.component
  - OrderStateMachine
transitively_affected:
  - OrderRepository  # depends on OrderStateMachine
profile: lite  # lite | assurance
created_at: 2026-08-29T10:00:00Z
lifecycle_state: EVIDENCE_LOCKED
```

#### 7.6.1a T0-only scope record

When a change touches only mechanical code (formatting, renaming, import reordering), a minimal scope record replaces the evidence packet:

```yaml
schema_version: 0.1.0
id: CH-002
title: "Reformat order module imports"
base_revision: commit:abc123...
head_revision: commit:def456...
changed_symbols:
  - src/domain/order/Order.ts  # import reorder only
new_dependencies: []
affected_constructs: []
transitively_affected: []
profile: lite
created_at: 2026-08-29T11:00:00Z
lifecycle_state: EVIDENCE_LOCKED
t0_only: true
t0_classification:
  claim_kind: mechanical
  impact: low
  derived_tier: T0
t0_rationale: "Import statement reordering only; no behavioral change. Classification confirms all affected claims derive to T0."
```

#### 7.6.2 Source record (evidence lock entry)

See §7.3 for the full example. Required fields are defined by source class in §5.2. All entries are **immutable and append-only**: the active lock set MAY be updated by adding or superseding entries, but existing entries are never modified in place.

#### 7.6.3 Claim record

See §7.4 for the full example. A claim MAY cite multiple sources:

```yaml
schema_version: 0.1.0
id: C-055
statement: "Order can be cancelled from CONFIRMED state"
rationale: "Business rule: confirmed orders may be cancelled before shipment"
sources:
  - ref: EL-001#cancellation-policy
    authority_domain: product-behavior
  - ref: EL-008#state-transitions
    authority_domain: api-semantics
claim_kind: behavioral
impact: medium
tier: T2
status: known-and-supported
constructs: [OrderStateMachine.cancelFromConfirmed]
validations: [test:cancel-confirmed-passes]
```

#### 7.6.4 Construct locator

```yaml
schema_version: 0.1.0
id: CL-001
symbol: src/domain/order/Order.ts#cancelOrder
symbol_kind: method  # class | function | method | module | component | boundary
claims: [C-055, C-017]
passport: order.aggregate  # optional, for passport-bearing constructs
coverage_status: covered  # covered | t0-exempt | uncovered
coverage_reason: null  # required if coverage_status is t0-exempt or uncovered
```

#### 7.6.5 Validation result

```yaml
schema_version: 0.1.0
id: V-001
claim: C-055
construct: CL-001
method: test  # test | lint | type-check | formal | manual | runtime-assertion
target: test:cancel-confirmed-passes
result: pass  # pass | fail | skipped
run_at: 2026-08-29T12:00:00Z
evidence_hash: sha256:...  # hash of test output or verification artifact
```

#### 7.6.6 Approval record

```yaml
schema_version: 0.1.0
id: AP-001
target_type: exception  # exception | decision | waiver | document
target_id: EX-007
approver: human
approver_id: "rom.iluz"
approved_at: 2026-08-29T14:00:00Z
rationale: "Runtime behavior confirmed; official docs silent on post-election behavior"
risk_accepted: true
expires_at: null  # optional expiry
```

#### 7.6.7 Exception record

See §14.3 for the full example. Additional normative fields:

```yaml
schema_version: 0.1.0
id: EX-007
claim: C-055
type: unknown  # unknown | unsupported | conflicting | experimental
description: "..."
recorded_at: 2026-08-29T14:00:00Z
recorded_by: agent
approved_by: null  # required for T2+
approval_id: null  # references AP-001 when approved
rationale: "..."
risk_assessment: "Medium"
search_record: "Checked: OWASP ASVS, Next.js docs, project ADRs. None cover this case."
status: pending-approval  # pending-approval | approved | rejected | superseded
superseded_by: null
```

An exception without a `search_record` is a conformance failure.

#### 7.6.8 Lifecycle state record

```yaml
schema_version: 0.1.0
id: CH-001
lifecycle_state: VERIFYING
state_history:
  - state: UNSCOPED
    entered_at: 2026-08-29T09:00:00Z
    actor: agent
  - state: EVIDENCE_REQUIRED
    entered_at: 2026-08-29T09:30:00Z
    actor: agent
    artifacts_produced: [knowledge-map-entry]
  - state: EVIDENCE_LOCKED
    entered_at: 2026-08-29T10:00:00Z
    actor: agent
    artifacts_produced: [EL-001, EL-003, PKT-001]
  - state: IMPLEMENTING
    entered_at: 2026-08-29T10:30:00Z
    actor: agent
  - state: VERIFYING
    entered_at: 2026-08-29T12:00:00Z
    actor: agent
```

#### 7.6.9 Evidence packet record

See §7.5 for the full example. The packet is a single artifact:

```yaml
schema_version: 0.1.0
id: PKT-001
change_id: CH-001
claims: [C-042, C-017, C-055]
evidence: [EL-001, EL-003, EL-008]
passports: [order.aggregate]
obligations: [order.no-direct-payment-gateway]
invariants: [...]
forbidden: [...]
validations_required: [...]
context_budget:
  max_tokens: 50000
  sections_selected: 12
  conflicts_included: 1
assembled_at: 2026-08-29T10:00:00Z
packet_digest: sha256:...
```

#### 7.6.10 Trace entry

```yaml
schema_version: 0.1.0
id: TR-001
change_id: CH-001
claim_id: C-055
construct_id: CL-001
validation_id: V-001
direction: forward  # forward | reverse
sweep_pass: true
checked_at: 2026-08-29T12:00:00Z
notes: null
```

#### 7.6.11 Project context record (`project-context.yaml`)

A governed record of the project's technology stack, runtime, dependencies, and architecture. This is NOT a glossary — it is the authoritative record of what the project IS, technically. It MUST be populated during Book initialization and updated whenever the stack changes.

```yaml
schema_version: 0.1.0
project_name: "my-app"
project_type: "web-application"  # web-application | api | cli | library | mobile | desktop | embedded | monorepo
language:
  primary: "TypeScript"
  version: "5.5.0"
runtime:
  name: "Node.js"
  version: "22.0.0"
  target: "es2022"
frameworks:
  - name: "Next.js"
    version: "15.1.0"
    role: "fullstack"
  - name: "React"
    version: "19.0.0"
    role: "ui"
package_manager: "npm"
lockfile: "package-lock.json"
dependencies:
  - name: "drizzle-orm"
    version: "0.36.0"
    type: "direct"
    evidence: "EL-003"
  - name: "zod"
    version: "3.23.0"
    type: "direct"
    evidence: "EL-004"
  - name: "next-auth"
    version: "5.0.0-beta"
    type: "direct"
    evidence: "EL-005"
databases:
  - name: "PostgreSQL"
    version: "16.0"
    role: "primary"
    connection: "env:DATABASE_URL"
deployment:
  platform: "Vercel"
  region: "us-east-1"
  build_command: "next build"
architecture:
  pattern: "modular-monolith"
  layers: ["app", "domain", "infrastructure"]
  boundaries: ["src/domain/**", "src/adapters/**"]
generated_at: "2026-08-29T10:00:00Z"
last_updated: "2026-08-29T10:00:00Z"
detection_method: "auto-scan"  # auto-scan | manual | hybrid
```

**Population rules:**
- During Book initialization, `ddd-book` MUST scan the project for `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `pom.xml`, `build.gradle`, `composer.json`, `Gemfile`, and other standard manifest files
- Lockfiles (`package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`, `poetry.lock`, `Cargo.lock`) MUST be parsed to resolve installed versions
- Config files (`tsconfig.json`, `next.config.js`, `vite.config.ts`, `.env.example`, `Dockerfile`, `docker-compose.yml`) SHOULD be scanned for runtime, build, and deployment information
- Framework detection MUST examine dependencies and config files, not just file names
- If auto-detection fails for any field, the field MUST be marked `unknown` with a `detection_note` — never silently left empty or guessed from parametric memory

#### 7.6.12 Domain model record

Domain models in `.ddd/models/` capture the structural and behavioral model of the problem domain. Each model file:

```yaml
schema_version: 0.1.0
id: DM-001
name: "Order lifecycle"
model_kind: state-machine  # state-machine | aggregate | entity | value-object | domain-service | event | context-map | threat-model | architecture
description: "State transitions for order processing"
sources:
  - ref: EL-002#domain-model
    authority_domain: domain-rules
  - ref: CONTEXT.md#Order
    authority_domain: product-behavior

# State machine model
states:
  - name: PENDING
    description: "Order created but not confirmed"
    allowed_transitions: [CONFIRMED, CANCELLED]
  - name: CONFIRMED
    description: "Order confirmed by customer"
    allowed_transitions: [SHIPPED, CANCELLED]
  - name: SHIPPED
    description: "Order dispatched"
    allowed_transitions: [DELIVERED]
  - name: DELIVERED
    description: "Order delivered to customer"
    allowed_transitions: []
  - name: CANCELLED
    description: "Order cancelled"
    allowed_transitions: []

invariants:
  - "Order cannot transition from SHIPPED to CANCELLED"
  - "Order total MUST equal sum of line item prices"

entities: [Order, LineItem, OrderEvent]
value_objects: [Money, Address]
aggregates: [Order]
domain_events: [OrderCreated, OrderConfirmed, OrderShipped, OrderCancelled]

# For threat models
# threats: [...]
# mitigations: [...]

# For architecture models
# components: [...]
# boundaries: [...]
# data_flows: [...]

created_at: "2026-08-29T10:00:00Z"
created_by: "agent"
independence: agent-proposed-human-approved
linked_passports: [order.aggregate]
linked_claims: [C-017, C-055]
```

**Model kinds:**
| Kind | Description |
|---|---|
| `state-machine` | State transitions, allowed/forbidden transitions, invariants |
| `aggregate` | Aggregate root, entities, value objects, invariants |
| `entity` | Entity definition with identity, lifecycle, relationships |
| `value-object` | Immutable value object with equality semantics |
| `domain-service` | Stateless domain operation spanning multiple aggregates |
| `event` | Domain event definition with payload schema |
| `context-map` | Bounded context relationships (upstream/downstream, anti-corruption layer) |
| `threat-model` | STRIDE or similar threat analysis with mitigations |
| `architecture` | Component, boundary, and data-flow diagram |

#### 7.6.13 Cross-document constraint record (`constraints.yaml`)

Records constraints that emerge from the interaction of multiple documents or sources. These cannot be expressed as claims from a single source.

```yaml
schema_version: 0.1.0
entries:
  - id: XC-001
    name: "edge-runtime-no-bcrypt"
    description: "bcrypt is not available in Edge Runtime; auth must use Web Crypto API"
    constraint_type: runtime-incompatibility  # runtime-incompatibility | version-conflict | platform-limitation | peer-dependency
    sources:
      - ref: EL-003#edge-runtime
        authority_domain: api-semantics
        constraint_role: "Edge Runtime does not support Node.js native modules"
      - ref: EL-004#bcrypt-requirements
        authority_domain: dependency-version-conflicts
        constraint_role: "bcrypt requires Node.js native bindings"
    affected_packages:
      - name: "bcrypt"
        version: "5.1.1"
        conflict: "requires Node.js native bindings, unavailable in Edge Runtime"
    affected_code_paths: ["src/middleware/auth.ts"]
    severity: blocking
    mitigation: "Use argon2 via Web Crypto API or move auth to Node.js runtime"
    recorded_at: "2026-08-29T10:00:00Z"
    linked_claims: [C-072]
    linked_exceptions: []
```

**Constraint types:**
| Type | Description |
|---|---|
| `runtime-incompatibility` | A dependency or API is unavailable in the target runtime |
| `version-conflict` | Two dependencies require incompatible versions of a shared dependency |
| `platform-limitation` | A feature is unavailable on the target platform (browser, server, edge, mobile) |
| `peer-dependency` | A peer dependency requirement conflicts with the project's installed version |

### 7.7 Existing artifact relationships

| Artifact | Relationship to DDD |
|---|---|
| `CONTEXT.md` | Discovery and interview workspace; not automatically authoritative. Becomes authoritative when referenced in the Book manifest with an independence level. |
| ADRs | First-class Book decisions. Referenced by the manifest. |
| `AGENTS.md` | Compact runtime index generated from the Book. Points agents to the Book and relevant artifacts. |
| Existing project docs | Remain canonical. Referenced, not copied. |
| `README.md` / onboarding docs | Discovery surface for new contributors and agents. SHOULD be governed: claims about project capabilities, architecture, and setup MUST trace to Book references. Factually incorrect README claims are a conformance failure when DDD governs the project. |
| `GETTING_STARTED.md` | Quick-start guide for DDD adoption. SHOULD be maintained alongside the Book. |
| Database/vector store | Rebuildable retrieval cache. Never the source of truth. |
| Trace matrix | Generated view of the Book's evidence graph. Not hand-maintained. |

---

## 8. Gates and Lifecycle

### 8.1 The five gates

Each gate is a hook point where DDD enriches existing workflow artifacts. Gates do not replace workflow steps; they sit between them.

| Gate | Placement | Trigger | Required outcome |
|---|---|---|---|
| **Evidence Scope** | After requirements are known | New feature or change | Technologies, decisions, risks, and required evidence identified. Knowledge Map updated. |
| **Evidence Lock** | Before implementation | Evidence Scope complete | Version-matched sources acquired and pinned. Evidence lock updated. Evidence packet assembled, or valid T0-only scope record (§4.2.1). |
| **Grounding Check** | During implementation | Each code construct written | Unsupported decisions trigger retrieval or an exception. Every construct traces to a claim or T0 exemption. |
| **Compliance Sweep** | Before completion | Implementation declared done | Forward trace complete. Reverse sweep complete. Undocumented behavior flagged. |
| **Assurance Review** | After Compliance Sweep | T3 claims present | Independent refuter challenges evidence and conclusions. Human approval for high-impact decisions. |

### 8.2 Integration examples

```
grill-with-docs → [Evidence Scope] → to-spec
to-spec → [Evidence Lock] → implement
implement → [Grounding Check] → code-review
code-review → [Compliance Sweep] → verification
T3 claims → [Assurance Review] → merge
```

### 8.3 Lifecycle state machine

Each change progresses through the following states:

```
UNSCOPED → EVIDENCE_REQUIRED → EVIDENCE_LOCKED → IMPLEMENTING → VERIFYING → CONFORMANT
```

**State definitions:**

| State | Meaning |
|---|---|
| `UNSCOPED` | Change proposed but not yet analyzed. No evidence gathered. |
| `EVIDENCE_REQUIRED` | Evidence Scope gate complete. Required domains and sources identified. |
| `EVIDENCE_LOCKED` | Evidence Lock gate complete. Sources acquired, pinned, and packet assembled — or valid T0-only scope record produced. |
| `IMPLEMENTING` | Code is being written against the evidence packet (or T0 scope record confirms mechanical-only changes). Grounding Check is active. |
| `VERIFYING` | Compliance Sweep is running. Forward and reverse traces are being validated. |
| `CONFORMANT` | All claims verified, no active blocking exceptions (T0/T1 non-blocking exceptions are permitted). Ready to merge. |
| `WAIVED` | Exceptions approved. Change proceeds with recorded epistemic gaps. |
| `BLOCKED_EVIDENCE_GAP` | Cannot find docs for a consequential claim. Cannot proceed. |
| `BLOCKED_CONTRADICTION` | Sources conflict and cannot be resolved at the current authority level. |
| `NONCONFORMANT` | Verification failed. Implementation does not match documented behavior. |

**Transitions:**

| From | To | Precondition | Required artifacts | Actor |
|---|---|---|---|---|
| `UNSCOPED` | `EVIDENCE_REQUIRED` | Evidence Scope gate passed | Knowledge Map entry, domain classification | Any agent |
| `EVIDENCE_REQUIRED` | `EVIDENCE_LOCKED` | Evidence Lock gate passed | Evidence lock entries and evidence packet, or valid T0-only scope record (§4.2.1) | Knowledge Curator |
| `EVIDENCE_REQUIRED` | `BLOCKED_EVIDENCE_GAP` | Required evidence not found after search | Search record, exception entry (type: `unknown`) | Any agent |
| `EVIDENCE_LOCKED` | `IMPLEMENTING` | Packet (or T0 scope record) delivered to implementer | Evidence packet or T0 scope record | Implementer |
| `IMPLEMENTING` | `VERIFYING` | Implementation declared complete. Construct-to-claim trace entries produced — or T0 scope record confirms no consequential claims. | Construct-to-claim traces, or T0 scope record | Implementer |
| `VERIFYING` | `CONFORMANT` | Forward trace complete, reverse sweep clean, no unresolved violations. **Assurance profile additionally requires**: Assurance Review passed (T3 refutation report complete), human approval for high-impact decisions, role separation verified. | Compliance report, trace matrix. Assurance: refutation report, approval records | Evidence Validator (Lite); Human Approver + Refuter (Assurance) |
| `VERIFYING` | `WAIVED` | Forward trace complete, exceptions approved at required level. **Assurance profile additionally requires**: Assurance Review passed. | Compliance report, approved exceptions. Assurance: refutation report | Human Approver (T2+ in Assurance; agent reviewer in Lite for T2, Human Approver for T3 in all profiles) |
| `VERIFYING` | `NONCONFORMANT` | Verification failed: trace incomplete, citation not entailed, or reverse sweep found undocumented behavior | Compliance report with violations | Evidence Validator |
| `VERIFYING` | `BLOCKED_CONTRADICTION` | Same-authority sources conflict within a claim domain | Conflict record in exception ledger | Evidence Validator |
| `BLOCKED_EVIDENCE_GAP` | `EVIDENCE_REQUIRED` | New evidence found or scope narrowed | Updated search record | Any agent |
| `BLOCKED_EVIDENCE_GAP` | `WAIVED` | Human approves waiver with explicit risk acceptance | Approved exception (type: `unsupported`) | Human Approver |
| `BLOCKED_CONTRADICTION` | `EVIDENCE_REQUIRED` | Conflict resolved by acquiring higher-authority source or narrowing scope | Resolution record | Any agent |
| `BLOCKED_CONTRADICTION` | `WAIVED` | Human approves proceeding under the conflict with risk acceptance | Approved exception (type: `conflicting`) | Human Approver |
| `NONCONFORMANT` | `IMPLEMENTING` | Implementation corrected to address violations | Updated code, updated traces | Implementer |
| `WAIVED` | `CONFORMANT` | All exceptions resolved (evidence found or design changed) | Updated compliance report | Evidence Validator |
| Any active change depending on invalidated source | `UNSCOPED` | Evidence lock entry invalidated (hash mismatch on re-verification) and new content contradicts existing claims | Drift report | Any agent |
| Any active change depending on invalidated source | `EVIDENCE_LOCKED` | Evidence lock entry invalidated but new content is consistent (version refresh only) | Drift report, new lock entry | Knowledge Curator |

**Re-entry after evidence changes:** Only changes that depend on the invalidated evidence lock entry are affected. Unrelated changes are not disrupted. When an evidence lock entry is superseded, all claims depending on that entry are flagged. The affected change returns to `UNSCOPED` if the new content contradicts existing claims, or to `EVIDENCE_LOCKED` if the new content is consistent (just a version refresh).

A CI gate MAY verify that every change reaches `CONFORMANT` or `WAIVED` before merge in the Lite profile. In the Assurance profile, a CI gate MUST verify this.

---

## 9. Discovery

### 9.1 Knowledge taxonomy (v2)

Eighteen dimensions:

1. Product and domain
2. Language, runtime, and framework
3. Architecture and distribution
4. Data and persistence
5. Security, privacy, and compliance
6. UX, accessibility, and design
7. Reliability, performance, and operations
8. Testing and verification
9. Delivery, migration, and compatibility
10. Organization and ownership
11. Observability and monitoring
12. Concurrency and async
13. Deployment, infrastructure, and IaC
14. Configuration and secrets management
15. Dependency and supply chain
16. Resilience and error handling
17. Internationalization and localization
18. Developer experience and tooling

### 9.1a Taxonomy extension

The taxonomy is extensible. A project MAY add domain dimensions specific to its context (e.g., mobile/PWA, browser compatibility, cost engineering, data governance). Extension rules:

1. A new dimension MUST have a unique `id`, `name`, and `trigger` signal
2. A new dimension MUST be recorded in the Knowledge Map with its applicability hypothesis
3. A new dimension SHOULD have at least one authoritative source class defined
4. Extension dimensions are project-scoped — they do not automatically propagate to other projects
5. A dimension that overlaps >70% with an existing dimension SHOULD be merged rather than added

### 9.2 Classification signals

| Signal | Knowledge triggered |
|---|---|
| Domain nouns, rules, lifecycle | Domain modeling and invariants |
| Authentication, PII, external input | Threat modeling and privacy |
| Queues, retries, distributed services | Idempotency, consistency, reliability |
| User interface | Accessibility and design system |
| Schema migration | Compatibility, rollback, recovery |
| Latency or throughput target | Performance methodology and observability |
| Public API | Versioning and contract testing |
| Money or measurements | Precision, units, value-object design |

### 9.3 Applicability hypothesis

For each relevant domain, the agent records:

- **Trigger**: what signal activated this domain
- **Questions**: what needs answering
- **Expected decisions**: what this knowledge will inform
- **Authority type**: what kind of source is needed
- **Confidence**: how certain is the applicability
- **Risk if omitted**: what goes wrong without this knowledge
- **Inclusion/exclusion reason**: why this domain is or isn't being pursued
- **Linked packages**: which project dependencies (from `project-context.yaml`) are relevant to this domain, with installed versions
- **Evidence**: which evidence lock entries cover this domain

**Knowledge map domain entry schema:**
```yaml
- id: api-semantics
  name: "API Semantics"
  trigger: "Authentication API calls in middleware"
  questions: ["Does the auth API support Edge Runtime?", "What session strategy is available?"]
  expected_decisions: ["Session strategy selection", "Runtime selection for auth"]
  authority_type: vendor-doc
  confidence: high
  risk_if_omitted: "Auth fails in production on Edge Runtime"
  inclusion_reason: "Change touches authentication middleware"
  linked_packages:
    - package: "next-auth"
      installed_version: "5.0.0-beta"
      evidence: "EL-005"
    - package: "bcrypt"
      installed_version: "5.1.1"
      evidence: null  # gap — no evidence locked yet
  evidence: [EL-003, EL-005]
  gaps:
    - "bcrypt compatibility with Edge Runtime not documented"
```

### 9.4 Discovery loop

1. Analyze the proposed change
2. Inspect affected code, dependencies, data, and boundaries
3. Match signals against the taxonomy
4. Consult the persistent project Knowledge Map
5. Retrieve authoritative primary sources
6. Identify missing or conflicting knowledge
7. Interview, experiment, or escalate
8. Update the Knowledge Map
9. Produce the bounded evidence packet

### 9.5 Adversarial discovery

Use STRIDE, FMEA, incident-pattern review, and "what must never happen?" questioning to expose unknown unknowns. Discovery is not only about finding what's relevant but also about finding what's missing.

### 9.6 Stop condition

Discovery stops when:

- All high-risk obligations have authoritative coverage
- Conflicts are resolved or explicitly blocked
- Remaining gaps are accepted and visible
- Additional retrieval no longer changes consequential decisions
- The context and time budget has not been exceeded

Without a stopping rule, DDD becomes endless research.

### 9.7 Doc acquisition adapters

DDD defines an abstract doc-provider interface. Any tool that produces provenance metadata is a valid adapter:

- Context7 (`resolve-library-id` + `query-docs`)
- Web search + fetch (with content hashing)
- Local files and package-bundled docs
- `llms.txt` sources
- Official source code, types, and test suites
- Package registries (npm, PyPI, crates.io, Maven Central, RubyGems, Go module proxy) for metadata, peer dependencies, and compatibility info
- OpenAPI / Swagger / GraphQL schemas as API contract evidence
- Database schema files (Prisma schema, SQL migrations, Drizzle schema) as persistence evidence
- Language core documentation (MDN, Python docs, Rust std docs, Go docs)
- Internal/authenticated docs (Confluence, Notion, internal wikis) with access-control provenance

**Cache policy:**

The local cache (`.ddd/cache/`) is content-addressed and immutable:

- Cache files MUST be named by their content hash: `.ddd/cache/{sha256-prefix}.md` (first 16 hex chars of the sha256 digest)
- This ensures identical content from different URLs deduplicates automatically
- Cache files SHOULD be gitignored (they are rebuildable from evidence lock entries)
- Eviction policy: cache entries older than their source's `freshness` period AND not referenced by any active evidence lock entry MAY be evicted
- Retention: cache entries referenced by active evidence lock entries MUST NOT be evicted
- Re-fetching: when a cache entry is evicted and later needed, the adapter MUST re-fetch, re-hash, and create a new cache file

**Access-control provenance:**

For authenticated or internal documents:
- The evidence lock entry MUST record `access_method` (e.g., `api-key`, `session-cookie`, `oauth`, `internal-network`)
- The evidence lock entry MUST NOT record credentials, tokens, or secrets
- Documents behind authentication MUST be cached locally after retrieval to avoid re-authentication
- The `independence` level for internal docs is `human-authored` or `agent-proposed-human-approved` (never `external`)

### 9.8 Stack detection

Before evidence discovery can begin, DDD MUST detect and record the project's technology stack. This is a mandatory step in `ddd-book` initialization and `ddd-scope` classification.

**Detection procedure:**

1. **Manifest files**: Scan for and parse `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `pom.xml`, `build.gradle`, `composer.json`, `Gemfile`, `mix.exs`, `deno.json`, and other standard project manifest files. Extract: language, runtime, frameworks, direct dependencies.

2. **Lockfiles**: Parse `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`, `poetry.lock`, `Cargo.lock`, `go.sum`, `Gemfile.lock`, and other lockfiles to resolve installed versions (not just declared ranges).

3. **Config files**: Scan `tsconfig.json`, `jsconfig.json`, `next.config.*`, `vite.config.*`, `webpack.config.*`, `Dockerfile`, `docker-compose.yml`, `.env.example`, `wrangler.toml`, `vercel.json`, and other config files for: runtime target, build settings, deployment platform, environment variables (names only, never values).

4. **Framework detection**: Identify frameworks by examining dependencies AND config files (not just file names). For example: Next.js requires `next` in dependencies AND a `next.config` file; Django requires `django` in dependencies AND a `manage.py` or `settings.py`.

5. **Database detection**: Scan for ORM/schema files (`prisma/schema.prisma`, `drizzle.config.ts`, `migrations/`, `alembic/`, `knexfile.js`) and connection strings in `.env.example` to identify databases and their versions.

6. **Architecture inference**: Examine directory structure (`src/domain/`, `src/adapters/`, `src/app/`, etc.) and import patterns to infer architecture pattern (layered, modular monolith, microservices, etc.).

7. **Populate `project-context.yaml`**: Record all detected values per §7.6.11. Fields that cannot be auto-detected MUST be marked `unknown` with a `detection_note` — never guessed from parametric memory.

**Fallback ladder for obscure/private/forked dependencies:**

1. Check the package registry (npm, PyPI, etc.) for the package name
2. If not found, check the project's own `node_modules/` or equivalent for bundled docs
3. If not found, search for the package source repository (GitHub, GitLab)
4. If not found, check if it's a private/internal package and follow authenticated doc acquisition (§9.7)
5. If still not found, record an exception (type: `unknown`) for the dependency — it MUST NOT be used without evidence or an approved waiver

### 9.9 Dependency enumeration

Every direct dependency used by a change MUST have version-matched evidence in the evidence lock. This is a mandatory step in `ddd-scope`.

**Enumeration procedure:**

1. Read `project-context.yaml` to get the full dependency list with installed versions
2. For each dependency whose code is touched by the change:
   a. Check if an evidence lock entry exists for the installed version
   b. If yes: verify the lock entry's `version` field matches the installed version
   c. If no: acquire documentation for the installed version via doc acquisition adapters (§9.7)
   d. If documentation cannot be acquired: record an exception (type: `unknown`)
3. For each new dependency introduced by the change (in `new_dependencies` per §7.6.1):
   a. Acquire version-matched documentation BEFORE implementation
   b. Check for peer dependency conflicts using registry metadata
   c. Check for cross-document constraints (§7.6.13) with existing dependencies
   d. Record the evidence lock entry or an exception
4. For transitive dependencies affected by the change:
   a. Flag them in the change record
   b. Evidence is SHOULD (not MUST) — transitive dependencies are typically covered by the direct dependency's docs

**Evidence lock entry for dependencies MUST include:**
- `product`: the package name
- `version`: the installed version (from lockfile, not the declared range)
- `source_url`: the documentation URL
- `authority_for`: at minimum `[api-semantics, dependency-version-conflicts]`

### 9.10 Tribal knowledge elicitation

Some project knowledge exists only in the minds of team members and is not documented. DDD MUST surface this rather than let it remain as hidden parametric memory.

**Elicitation protocol:**

1. After stack detection and evidence discovery, identify knowledge gaps where the agent would normally rely on parametric memory
2. For each gap, formulate a specific question (not "tell me everything about the project")
3. Present questions to the human collaborator
4. Record answers as `human-authored` evidence (independence: `human-authored`) with the collaborator identified
5. Tribal knowledge that cannot be elicited (no one available, no answer) MUST be recorded as an exception (type: `unknown`)

**Tribal knowledge evidence record:**
```yaml
schema_version: 0.1.0
id: EL-020
source_class: project-doc
repository_path: ".ddd/tribal-knowledge/auth-design-decisions.md"
doc_version: "commit:abc123..."
retrieved_at: "2026-08-29T14:00:00Z"
content_digest: sha256:...
sections: ["Why we chose JWT over sessions", "Why auth runs on Edge Runtime"]
authority_for: [project-architecture, product-behavior]
independence: human-authored
approved_by: "jane.doe"
```

### 9.11 Code-derived artifacts as L0 evidence

Some evidence is derived from the project's own code rather than external documentation. These are `code-derived` source class (§5.2) and MAY serve as L0 sources for specific claim domains.

**Valid uses:**
- Generated OpenAPI/GraphQL schemas as evidence for API contract claims
- Database migration files as evidence for schema evolution claims
- Type definitions as evidence for interface contracts
- Build output / bundle analysis as evidence for performance claims
- Inferred dependency graph as evidence for architecture boundary claims

**Constraints:**
- `code-derived` sources have `independence: agent-proposed-human-approved` (they are derived by tooling, not authored by a human) unless a human explicitly reviews and approves them
- `code-derived` sources MUST NOT be the sole evidence for `behavioral` or `operational` claims — they can supplement but not replace authoritative documentation
- `code-derived` sources MUST record `repository_path` and `doc_version` (commit hash) for reproducibility

---

## 10. Design Tournament

### 10.1 Trigger criteria

A tournament is **required** when a decision is:

- Architecturally consequential
- Security or safety sensitive
- Expensive to reverse
- Supported by multiple plausible methodologies
- Based on uncertain or conflicting evidence
- Likely to shape many future objects

A tournament MUST NOT run for naming variables, ordinary CRUD, or settled project conventions.

### 10.2 Protocol

1. **Freeze the design brief**: all candidates receive identical requirements, constraints, evidence corpus, risks, quality priorities, and architecture restrictions.

2. **Generate 2-3 independent alternatives**:
   - **Mandatory**: simplest viable design (the baseline that could work)
   - **Mandatory**: quality/domain-optimized design
   - **Optional**: hybrid when genuinely distinct from the above two

   Independent agent contexts SHOULD be used to reduce anchoring.

3. **Produce standardized design cards**. Each card states:
   - Object and responsibility model
   - Data and control flow
   - Invariants
   - Failure behavior
   - Trust boundaries
   - Applied methodologies and applicability rationale
   - Rejected complexity
   - Required controls
   - Operational consequences
   - Evidence citations
   - Known uncertainties

4. **Evaluate against predeclared criteria**. Hard constraints are pass/fail. Remaining criteria are weighted **before** candidates are revealed:
   - Correctness and invariant coverage
   - Simplicity
   - Documentary support
   - Security
   - Testability
   - Operability
   - Evolvability
   - Reversibility
   - Performance
   - Implementation and maintenance cost

   No popularity voting.

5. **Jury structure**:
   - Deterministic constraint checker
   - Evidence-validity reviewer
   - Relevant specialist critics
   - Independent synthesis agent (cannot be a candidate's author)
   - Human approval for high-impact decisions

6. **Resolve empirical disputes**: when evidence cannot settle a dispute, authorize a bounded spike, benchmark, or experiment.

7. **Preserve negative knowledge**: rejected designs are summarized in the resulting ADR:
   - Why they lost
   - Which assumptions mattered
   - Under what future conditions they should be reconsidered

   Do not retain pages of agent debate. Keep rejected alternatives compactly.

---

## 11. Object Passports

### 11.1 When required

A passport is **required** when a design unit:

- Owns domain meaning or invariants
- Owns mutable state or a lifecycle
- Crosses a trust, process, or data boundary
- Exposes a stable interface
- Persists data or events
- Performs irreversible side effects
- Coordinates multiple components
- Has high coupling or high failure impact

DTOs, trivial helpers, generated types, and framework glue inherit coverage from a parent passport.

### 11.2 Passport schema

```yaml
id: order.aggregate
kind: aggregate
purpose: Protect the consistency of an accepted order
domain_sources: [CONTEXT.md#Order, EL-002#domain-model]
responsibilities:
  - Maintain order invariant: total matches line items
  - Transition through valid states only
non_responsibilities:
  - Payment processing
  - Inventory reservation
invariants:
  - "Order total MUST equal sum of line item prices"
  - "Order cannot transition from SHIPPED to CANCELLED"
states: [PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED]
collaborators: [PaymentService, InventoryService]
allowed_dependencies: [domain.events, domain.value-objects]
forbidden_dependencies: [adapters.payment, adapters.email]
methodology:
  pattern: aggregate-root
  source: EL-005#ddd-blue-book
  applicability_rationale: "Order has invariants spanning multiple line items and a state machine"
risks:
  - id: R-001
    description: "Concurrent cancellation and shipment"
    severity: high
    mitigation: "Optimistic locking on order version"
controls:
  - order.no-direct-payment-gateway
  - order.state-transition-validation
validating_tests:
  - test:order-invariant-total
  - test:order-state-machine
  - test:order-concurrent-cancel
symbols:
  - src/domain/order/Order.ts
  - src/domain/order/OrderRepository.ts
```

### 11.3 Storage and inheritance

- Canonical passport lives in `.ddd/passports/`
- Code contains only a lightweight stable identifier when necessary (e.g., `// @ddd:passport order.aggregate`)
- Module-level passports MAY cover subordinate units through inheritance
- A passport that restates an entire class is a failure — it should capture the design contract and why, not the implementation

### 11.4 Relationship to other artifacts

| Artifact | Role |
|---|---|
| Passport | Durable design identity and responsibilities |
| Claim ledger | Atomic assertions requiring support |
| Evidence graph | Connections among claims, sources, symbols, and controls |
| Trace matrix | Generated reporting view of the evidence graph |

---

## 12. Executable Controls

### 12.1 Control Obligation IR

DDD defines a target-agnostic intermediate representation:

```yaml
id: order.no-direct-payment-gateway
rule: "Order domain code must not import payment adapters"
source: ADR-004
scope: "src/domain/order/**"
severity: blocking
preferred_enforcement: architecture-test
expected_failure: "Dependency edge from domain to payment adapter"
residual_risk: "Reflection and runtime service lookup could bypass"
```

### 12.2 Enforcement levels

1. **Documented rationale** — the rule exists in docs only
2. **Review checklist** — a reviewer must verify manually
3. **Executable assertion** — a test or lint rule checks it
4. **Blocking automated gate** — CI fails if violated
5. **Formal or model-checked property** — a prover verifies it

DDD SHOULD compile to the strongest practical level, not automatically demand level 5.

### 12.3 Generation boundary

DDD MAY generate the actual control when:
- A trusted adapter exists for the target toolchain
- The mapping from obligation to control is deterministic enough
- The project supports the target tool
- The generated control can be validated

Otherwise, DDD MUST emit a precise implementation recipe and report the obligation as `uncompiled`.

**Never claim prose has become executable when no gate exists.**

### 12.4 Control validation

Generated controls are also code. Each MUST demonstrate:
- A compliant fixture passes
- A violating fixture fails
- The failure message identifies the obligation
- It runs in the relevant CI path

Mutation testing is recommended: deliberately violate the documentary rule and confirm the control catches it.

### 12.5 Adapter targets

| Target | Examples |
|---|---|
| Types | Branded values, exhaustive unions, opaque types |
| Schemas | JSON Schema, Zod, database constraints |
| Linters | ESLint, Semgrep, ArchUnit, dependency-cruiser |
| Tests | Contract tests, property-based tests, state-machine tests |
| Policies | OPA, Cedar |
| Design | Design tokens, accessibility checkers |
| CI | GitHub Actions, GitLab CI gates |

Adapters are integrations, not DDD skills.

---

## 13. Traceability and Verification

### 13.1 Nested traceability model

```
L0 Source → L1 Claim (with rationale) → L2 Construct → L3 Validation
```

- **L0 Source**: the authoritative document (vendor doc, requirement, ADR, standard, domain model)
- **L1 Claim**: a normative statement extracted from the source, with a rationale explaining why it exists
- **L2 Construct**: the code element that implements the claim (class, function, module, boundary)
- **L3 Validation**: the executable check that verifies the construct satisfies the claim

Every L2 construct MUST trace to at least one L1 claim. Every L1 claim MUST trace to at least one L0 source **or an explicit exception** (§14). L3 validation is required for T2+ claims. T3 claims require independent refutation in addition to validation.

### 13.2 Proof tiers and risk classification

Traceability depth is determined by **two independent axes**: what a claim concerns (claim kind) and how dangerous it is (impact). A claim inherits the highest impact of its context and affected invariants.

**Claim kind** (what the claim concerns):

| Kind | Description |
|---|---|
| `mechanical` | Formatting, obvious variable plumbing, structural scaffolding |
| `api` | Imports, configuration, framework conventions, library usage |
| `behavioral` | Requirements, state transitions, error handling, business rules |
| `architectural` | Boundaries, component responsibilities, dependency direction |
| `operational` | Auth, cryptography, data loss, migrations, permissions, compliance |

**Impact** (how dangerous failure is):

| Impact | Criteria |
|---|---|
| `low` | No externally observable effect; easily reversible; no data or security implications |
| `medium` | Affects behavior or correctness within a bounded component; recoverable |
| `high` | Affects externally observable behavior or multiple components; difficult to reverse |
| `critical` | Affects security, data integrity, privacy, financial correctness, or operational continuity |

**Proof tier** is derived from both axes using the following function:

1. **Impact establishes a minimum tier**: `low` → T0 minimum, `medium` → T1 minimum, `high` → T2 minimum, `critical` → T3 minimum.
2. **Claim kind may increase but never decrease the tier**:
   - `mechanical` → no increase (stays at impact-driven minimum)
   - `api` → raises to at least T1
   - `behavioral` → raises to at least T2
   - `architectural` → raises to at least T2
   - `operational` → raises to at least T2; raises to at least T3 when impact is `high` or `critical`
3. **The derived tier is the maximum of the impact-driven minimum and the kind-driven minimum.**

| claim_kind \ impact | low | medium | high | critical |
|---|---|---|---|---|
| `mechanical` | T0 | T1 | T2 | T3 |
| `api` | T1 | T1 | T2 | T3 |
| `behavioral` | T2 | T2 | T2 | T3 |
| `architectural` | T2 | T2 | T2 | T3 |
| `operational` | T2 | T2 | T3 | T3 |

A claim classified as `api` kind but with `critical` impact (e.g., an authentication API call) is T3, not T1. Impact escalates the tier; kind alone never downgrades below the impact-driven minimum.

**Ambiguous classification escalates**: when either axis cannot be determined, classify at the higher tier.

Every line of code MUST belong to an implementation region whose consequential claims are covered. A line that belongs to no region is a traceability violation.

**Required traceability by tier:**

| Tier | Required traceability |
|---|---|
| T0 | Covered by enclosing claim. No individual citation. |
| T1 | Symbol or usage mapped to versioned evidence |
| T2 | Requirement → evidence → code → test |
| T3 | T2 plus explicit rationale and independent refutation |

### 13.3 Bidirectional sweeps

**Forward sweep:**
```
requirement → claim → evidence → implementation → validation
```
Verifies that documented decisions are implemented.

**Reverse sweep:**
```
consequential implementation behavior → claim or approved exception
```
Verifies that every consequential code behavior has documentary lineage. This is what prevents undocumented functionality and citation laundering.

### 13.4 Citation entailment

Verification MUST ask: "Does this source entail this claim?" — not merely "Does this claim have a URL?"

A citation that does not support its claim is a conformance failure, not a valid trace.

**Entailment verification procedure:**

For each claim-source pair, the verifier performs the following steps:

1. **Locate the cited section**: Open the evidence lock entry and navigate to the specific `sections` referenced by the claim's `ref` field (e.g., `EL-001#Server Components`). If the section cannot be located, the citation fails.

2. **Read the source content**: Read the actual cached content at the cited section. Do NOT rely on the claim author's summary — read the source text directly.

3. **Extract the source's assertions**: Identify what the source text explicitly states. Distinguish between:
   - **Explicit statement**: the source directly says X
   - **Implicit entailment**: the source says A and B, from which X logically follows
   - **Not addressed**: the source does not mention X or anything that entails X

4. **Compare claim to source assertions**: For each claim:
   - If the claim is an **explicit statement** of the source: entailed ✓
   - If the claim is an **implicit entailment** (derivable from source statements): entailed ✓, but the claim's `rationale` field MUST explain the derivation
   - If the claim is a **paraphrase** of the source: entailed ✓ if semantically equivalent
   - If the claim is **not addressed** by the source: NOT entailed ✗ — conformance failure
   - If the claim **contradicts** the source: NOT entailed ✗ — conformance failure, and a conflict is recorded

5. **Record the entailment result**: Each claim-source pair records:
   ```yaml
   claim_id: C-042
   source_ref: EL-001#Server Components
   entailment: explicit  # explicit | implicit | paraphrase | not-entailed | contradicts
   verifier_notes: "Source states 'Server Components cannot use browser-only APIs such as window or document' — claim is a direct paraphrase"
   ```

6. **Batch verification**: For changes with many citations, prioritize verification by tier:
   - T3 claims: every citation MUST be verified
   - T2 claims: every citation MUST be verified
   - T1 claims: sample verification is acceptable (at least 30% of citations)
   - T0 claims: no individual citation required

7. **Stopping rule**: Citation entailment verification is complete when all T2+ citations have been individually checked and the sample of T1 citations has been verified.

### 13.5 Risk rubric

The following terms are used throughout this specification to determine when risk-triggered features activate. Each term has an operational definition:

**Consequential**: a claim, decision, or behavior is consequential when its failure would affect externally observable behavior, architectural integrity, security, data integrity, or operational correctness. Non-consequential: formatting, logging verbosity, internal naming.

**High-impact**: failure affects externally observable behavior or multiple components, and is difficult to reverse. See the impact axis in §13.2.

**Hard-to-reverse**: the change cannot be undone without data migration, downtime, or breaking external consumers. Examples: database schema changes, public API contract changes, data format changes.

**Responsibility-bearing**: a design unit that owns domain meaning, mutable state, a trust boundary, a stable interface, persisted data, irreversible side effects, or multi-component coordination. See §11.1 for the full criteria.

**Implementation region**: a contiguous set of lines within a single construct (function, class, module) that share a single claim or set of claims. Lines not belonging to any region are traceability violations.

**Trusted adapter**: a code generation adapter that has been validated against the control validation protocol (§12.4) with both compliant and violating fixtures. An adapter is not trusted until its generated controls have been mutation-tested.

**Risk assessment factors** (used to determine impact and whether risk-triggered features activate):

| Factor | Question |
|---|---|
| Impact | What is the severity of failure? |
| Likelihood | How probable is failure given the current evidence? |
| Reversibility | Can the change be undone without significant cost? |
| Blast radius | How many components, services, or users are affected? |
| Trust-boundary involvement | Does the change cross a security or trust boundary? |
| Data sensitivity | Does the change touch PII, financial data, or credentials? |
| Regulatory exposure | Does the change affect compliance requirements? |
| Uncertainty | How confident is the evidence? Are there conflicts or gaps? |

**Ambiguity escalates risk.** When a factor cannot be determined, the claim or change is classified at the higher risk level.

### 13.6 Test-code traceability

Test code is itself code and MUST be classified within the traceability model:

| Test category | Claim kind | Typical tier | Traceability requirement |
|---|---|---|---|
| Unit test for a traced claim | `mechanical` (validation artifact) | T0 | Covered by the claim it validates |
| Integration test for a behavioral claim | `behavioral` | T2 | MUST trace to the behavioral claim it validates |
| Contract test for an API claim | `api` | T1 | MUST trace to the API claim and the evidence lock entry for the API spec |
| Property-based test for an invariant | `behavioral` | T2 | MUST trace to the invariant claim |
| Security test for an operational claim | `operational` | T3 | MUST trace to the operational claim and have independent refutation |
| Smoke/sanity test | `mechanical` | T0 | Covered by enclosing claim |
| Test fixture/setup code | `mechanical` | T0 | Covered by the test's claim |

**Key principle:** Tests are L3 validations (§13.1). They verify that L2 constructs satisfy L1 claims. A test that validates no claim (or validates a claim not in the ledger) is itself a reverse-sweep violation — it is consequential behavior with no documentary lineage.

---

## 14. Exceptions and Epistemic Gaps

### 14.1 First-class exceptions

Exceptions are honest records of gaps, not failures. The system needs an honest exception process rather than forcing fake citations.

### 14.2 Risk-based escalation

Exception handling is driven by the **derived tier** (from claim_kind + impact, see §13.2), not by claim kind alone. An undocumented authentication API call is `operational` kind with `critical` impact → T3, not a harmless API exception.

| Derived tier | Exception handling |
|---|---|
| T0 / T1 | Record the exception with rationale. No block. The change remains in its current lifecycle state; non-blocking exceptions are attached to the compliance report and do not prevent `CONFORMANT`. |
| T2 | Record and flag for review. SHOULD be resolved before merge. If unresolved at merge, MUST receive the approval required by the selected profile (Lite: agent review; Assurance: human approval). |
| T3 | **Blocked.** Requires human approval. Cannot proceed without explicit waiver. |

### 14.3 Exception ledger

Each exception:

```yaml
schema_version: 0.1.0
id: EX-007
claim: C-055
type: unknown  # unknown | unsupported | conflicting | experimental
description: "No official documentation found for database change stream resume token behavior after election"
recorded_at: 2026-08-29T14:00:00Z
recorded_by: agent
approved_by: null  # required for T2+
approval_id: null  # references AP-001 when approved
rationale: "Runtime experiment confirms behavior; official docs are silent"
risk_assessment: "Medium - change streams are not in the critical path"
search_record: "Checked: vendor docs, project ADRs, OWASP. None cover this case."
status: pending-approval  # pending-approval | approved | rejected | superseded
superseded_by: null
```

### 14.4 Anti-Goodhart measures

- An exception count that is too high triggers a methodology review, not a block
- Exceptions MUST cite what was searched and why no evidence was found
- An exception without a search record is a conformance failure
- The goal is honest gaps, not exception inflation or citation fabrication

### 14.5 Claim retraction

A claim MAY be retracted when it is discovered to be false, superseded, or no longer applicable. Retraction is NOT deletion — the claim remains in the ledger with `status: retracted`.

**Retraction procedure:**

1. Mark the claim with `status: retracted` and add `retracted_at` timestamp
2. Record `retraction_reason`: why the claim is being retracted (e.g., "Evidence source superseded", "Claim found to be false during refutation", "Feature removed from product")
3. Identify all constructs that trace to the retracted claim (via the trace matrix)
4. For each affected construct:
   a. If the construct's behavior is still needed: find or create a replacement claim with valid evidence
   b. If the construct's behavior is no longer needed: mark the construct for removal
   c. If neither: record an exception (type: `unknown`) for the construct
5. Update the trace matrix to reflect the retraction
6. Any change that cited the retracted claim MUST return to `UNSCOPED` for re-scoping

**Retracted claim record:**
```yaml
schema_version: 0.1.0
id: C-042
statement: "Server components cannot use browser-only APIs"
# ... (original fields preserved) ...
status: retracted
retracted_at: "2026-08-29T16:00:00Z"
retraction_reason: "Evidence source EL-001 superseded by EL-009 which clarifies server components CAN use some browser APIs via polyfills"
replacement_claim: C-078  # if a replacement exists
```

A retracted claim MUST NOT be cited by any active construct. A construct still citing a retracted claim is a conformance failure.

---

## 15. Integration and Adapter Contract

### 15.1 Hook specification

Each gate defines:

- **Trigger**: what lifecycle event activates it
- **Inputs**: what artifacts it reads
- **Outputs**: what artifacts it produces or updates
- **Block condition**: what prevents progression
- **Pass condition**: what allows progression

### 15.2 Existing workflow integration

| Workflow | DDD hook points |
|---|---|
| Matt Pocock skills | `grill-with-docs` → Evidence Scope → `to-spec` → Evidence Lock → `implement` → Grounding Check → `code-review` → Compliance Sweep |
| Superpowers | Brainstorm → Evidence Scope → Spec → Evidence Lock → Plan → Grounding Check → TDD → Compliance Sweep → Review → Assurance Review |
| GitHub Spec Kit | Specify → Evidence Scope → Plan → Evidence Lock → Tasks → Grounding Check → Implement → Compliance Sweep → Converge → Assurance Review |
| CI | Compliance Sweep gate on PR; Assurance Review for T3; Drift detection on schedule |

### 15.3 Machine API

Beneath the skill surface, DDD exposes stable machine operations:

- `classify(change) → domains`
- `discover(domains) → evidence[]`
- `lock(evidence[]) → lock_entry`
- `packet(change, lock) → evidence_packet`
- `claim(statement, source) → claim_id`
- `trace(claim_id, construct) → trace_entry`
- `sweep(direction) → violations[]`
- `refute(claim_id) → refutation_report`
- `exception(claim_id, type, rationale) → exception_id`
- `obligation(rule, source, scope) → obligation_id`
- `compile(obligation_id, adapter) → control`
- `drift_check() → drift_report[]`

Existing harnesses MAY invoke these primitives directly without using DDD skills.

---

## 16. Conformance Profiles

### 16.1 Lite profile

For solo developers and low-risk changes:

- Automated evidence acquisition
- Claim ledger maintained
- T1 API traceability and T2 behavioral traceability
- Reverse sweep with recorded enforcement mode (§4.2.1: manual, agent-assisted, or tool-enforced)
- No mandatory independent reviewer
- **Lite MUST NOT accept T3 (critical) claims. Any T3 claim automatically escalates the change to the Assurance profile.**
- Book manifest and evidence lock maintained
- Freshness checks on evidence lock entries (stale entries flagged)
- Exceptions recorded; T2 exceptions SHOULD be resolved before merge

### 16.2 Assurance profile

For teams and high-risk work:

- Pinned evidence lock with freshness checks on a schedule
- Explicit trace matrix
- T3 independent refutation required (minimal refutation in V1; specialist refuters in V2)
- Human approval for all exceptions at T2+
- Human approval for high-impact design decisions
- Retained compliance artifacts
- CI-enforced gates (Compliance Sweep must pass)
- Role separation enforced (6.2)
- Continuous drift monitoring (V3; V1 and V2 use scheduled freshness checks only)

### 16.3 Risk override

Risk MUST override convenience. A solo developer changing authorization logic MUST use the Assurance profile, regardless of team size.

### 16.4 What "DDD-compliant" means

A project is DDD-compliant at the **Lite** level when:

1. A Book manifest exists and is maintained
2. An evidence lock exists with provenance for all cited sources
3. Every consequential claim traces to an L0 source or an explicit exception
4. A reverse sweep has been performed and all undocumented behavior is either resolved or excepted — zero unresolved blocking violations
5. Epistemic gaps are visible and classified

A project is DDD-compliant at the **Assurance** level when additionally:

6. T3 claims have independent refutation reports (minimal in V1, specialist in V2)
7. Exceptions at T2+ have human approval
8. CI gates enforce the Compliance Sweep (MUST pass)
9. Role separation is enforced for T3 work
10. Freshness checks run on a schedule (V1-V2); continuous drift detection (V3)

---

## 17. Versioning and Migration

### 17.1 Spec versioning

This specification is versioned using semantic versioning:

- **Major**: breaking changes to the methodology or artifact schemas
- **Minor**: additive features (new gates, new artifact types, new tiers)
- **Patch**: clarifications, corrections, examples

### 17.2 `.ddd/` schema versioning

The Book manifest declares its schema version. DDD tools MUST support at least one prior major version. Migration scripts SHOULD accompany breaking schema changes.

### 17.3 Incremental adoption

DDD applies to new changes by default. Existing code is grandfathered. Conformance is primarily **change-level**, not project-level. Project-level conformance SHOULD state its coverage boundary and legacy debt.

**Change scope boundary:**

Every DDD-governed change MUST define its scope:

- **Base revision**: the Git commit the change is built on
- **Head revision**: the Git commit the change produces
- **Changed symbols**: functions, classes, modules added or modified
- **Newly introduced dependencies**: packages, modules, or services newly imported
- **Transitively affected constructs**: existing constructs whose behavior or interface is materially affected by the change
- **Materially modified existing constructs**: existing constructs whose implementation body changed beyond mechanical edits

**Grandfathering rules:**

- Existing code outside the change scope is grandfathered and exempt from traceability requirements
- A grandfathered construct that is **materially modified** by the change enters DDD scope and MUST be traced
- A grandfathered construct that is **only transitively affected** (its caller changed, but its own implementation did not) is flagged but not required to have full traceability
- New behavior MUST NOT be introduced inside grandfathered files without entering DDD scope for the affected symbols
- The reverse sweep scope is limited to the change boundary, not the entire repository

**Coverage boundary:**

Project-level conformance reports MUST include:

- The set of DDD-governed changes
- The set of grandfathered files and symbols
- Known legacy debt (grandfathered constructs with known documentation gaps)
- Coverage percentage (DDD-governed vs. total codebase)

An optional `ddd-audit` can retroactively build a constitution draft for existing code by:
- Extracting claims from existing code
- Matching them to existing docs, ADRs, and domain models
- Flagging gaps and contradictions
- Producing a draft Book for human review

### 17.4 Monorepo scoping

In a monorepo, DDD scope is per-package, not per-repository. Each package (workspace, crate, module, app) MAY have its own Book or share a federated Book.

**Monorepo book strategies:**

| Strategy | When to use | Structure |
|---|---|---|
| **Federated** | Packages share architecture, team, and dependencies | Root `.ddd/` with `project-context.yaml` covering all packages; per-package claim subsets |
| **Per-package** | Packages are independent or owned by different teams | `.ddd/` in each package directory; each has its own Book, evidence lock, and claims |
| **Hybrid** | Some packages are tightly coupled, others are independent | Root `.ddd/` for shared concerns (architecture, security); per-package `.ddd/` for package-specific claims |

**Scoping rules:**

1. A change that touches multiple packages MUST define a scope per package
2. Cross-package dependencies are `transitively_affected` constructs in each package's change record
3. A cross-package constraint (e.g., "package A must not import from package B's internals") is recorded as a cross-document constraint (§7.6.13)
4. The reverse sweep scope is limited to the change boundary within each affected package
5. Coverage reports MAY be per-package or aggregate

### 17.5 Incident and postmortem feedback loop

Incidents reveal gaps in the documentary basis of the system. DDD SHOULD capture incident learnings as evidence:

**Feedback procedure:**

1. When an incident occurs, the postmortem/root-cause-analysis is recorded as a `project-doc` evidence source
2. Claims derived from the postmortem (e.g., "Retry logic MUST use jittered backoff") are added to the claim ledger
3. If the incident reveals a documentation gap (no existing claim covers the failure mode), an exception is recorded
4. If the incident reveals a documentation error (existing claim is wrong), the claim is retracted (§14.5) and replaced
5. Control obligations derived from postmortem recommendations are created and compiled (§12)
6. The Knowledge Map is updated with any newly discovered risk domain

**Postmortem evidence record:**
```yaml
schema_version: 0.1.0
id: EL-030
source_class: project-doc
repository_path: "docs/postmortems/2026-08-29-order-service-outage.md"
doc_version: "commit:abc123..."
retrieved_at: "2026-08-30T10:00:00Z"
content_digest: sha256:...
sections: ["Root cause", "Action items", "Lessons learned"]
authority_for: [reliability, operational]
independence: human-authored
```

This creates a closed loop: incidents → evidence → claims → controls → prevention → fewer incidents.

---

## 18. Evaluation

### 18.1 Success metrics

DDD projects SHOULD measure:

- Hallucinated API invocation rate
- Version mismatch rate
- First-pass build success rate
- First-pass test success rate
- Regression rate after merge
- Documentation-version mismatch rate
- Percentage of consequential claims with valid evidence
- Citation entailment correctness (does the source actually support the claim?)
- Reverse sweep violation count
- Exception rate and approval time
- Token cost and task latency vs. baseline
- Security-policy violations
- Documentation drift frequency
- Human correction time

### 18.2 Conformance test suite

A DDD conformance test suite SHOULD include:

- A project with a valid Book that passes Compliance Sweep
- A project with an invalid citation (source does not entail claim) that fails
- A project with an undocumented consequential behavior that fails reverse sweep
- A project with a stale evidence lock (hash mismatch) that fails freshness check
- A project with a T3 claim lacking refutation that fails Assurance profile
- A project with a circular self-justification (agent-authored-unapproved cited as evidence) that fails
- A project with a prompt-injection attempt in retrieved docs that is neutralized

---

## 19. Rollout

### 19.1 Version 1: Useful foundation

- Federated Engineering Book (manifest, references to existing docs)
- Knowledge Map (taxonomy, applicability hypotheses)
- Evidence lock (provenance, content hashing)
- Evidence packets (bounded context bundles)
- Risk-triggered object passports
- Reverse sweep
- Forward traceability
- Exception ledger
- Workflow adapters (hooks for Superpowers, Matt Pocock, Spec Kit, CI)
- Freshness checks on evidence lock entries (scheduled, not continuous)
- Minimal independent refutation for T3 claims in Assurance profile (a second agent context or human reviewer; specialist refuter roles arrive in V2)

**Value delivered:** Every consequential code change is grounded in versioned, authoritative documentation. Undocumented behavior is detected. Epistemic gaps are visible. Assurance-profile changes with T3 claims receive at least a minimal adversarial review.

### 19.2 Version 2: Decision intelligence

- Grounded design tournament
- Standardized design cards
- Specialist refuters (dedicated adversarial reviewer role, beyond V1 minimal refutation)
- Applicability engine (select techniques based on problem fit)
- Negative-knowledge retention (rejected designs in ADRs)

**Value delivered:** Architecturally consequential decisions are evaluated against evidence before selection. Pattern soup is prevented. The simplest sufficient design is preferred.

### 19.3 Version 3: Executable engineering

- Control Obligation IR
- Toolchain adapters (ESLint, Semgrep, ArchUnit, contract tests, OPA, CI gates)
- Mutation validation of generated controls
- Drift monitoring (evidence, documentation, decisions, controls, code) — supersedes V1 scheduled freshness checks with continuous detection
- Selective formal verification for T3 claims

**Value delivered:** Documentary rules become machine-enforceable. Drift between docs and code is detected automatically. High-risk claims have formal or adversarial verification.

---

## 20. Worked Examples

### 20.1 Successful feature: Add order cancellation

1. **Evidence Scope**: Change classified as domain + state machine + API. Knowledge Map triggers: domain modeling, state machine patterns, framework conventions. Applicability hypothesis: "State machine pattern relevant because Order has multi-state lifecycle."

2. **Evidence Lock**: Next.js 15.1.0 docs (server actions), domain modeling reference (aggregate pattern), project ADR-007 (Order is aggregate root). All version-matched, hashed, and locked.

3. **Evidence Packet**: Claims C-042 (server component constraints), C-017 (Order aggregate invariants), C-055 (cancellation state transitions). Passports: `order.aggregate`. Invariants: "Order can only be cancelled if PENDING or CONFIRMED." Forbidden: "Cancelling SHIPPED orders."

4. **Implementation**: Code written against the packet. Each construct traces to a claim. `cancelOrder()` method → C-055. State guard → invariant. Server action → C-042.

5. **Grounding Check**: All constructs have claims. No unsupported decisions. One T0 region (formatting) exempted.

6. **Compliance Sweep**: Forward trace complete (C-042, C-017, C-055 all implemented). Reverse sweep: no undocumented behavior. Tests: `cancel-pending` passes, `cancel-confirmed-passes` passes, `cancel-shipped-rejected` passes.

7. **Result**: `CONFORMANT`. Ready to merge.

### 20.2 Documentation conflict: Cross-domain discrepancy between docs and runtime

> *The following example is explicitly fictional. The quoted documentation and observed behavior are illustrative, not real claims about any specific product.*

1. During implementation, the agent discovers that a database's change stream resume tokens behave differently after a replica set election than the official docs describe.

2. **The discrepancy is cross-domain**, not a same-authority contradiction:
   - Official documentation (EL-008) is authoritative for **API semantics** (supported behavior): it states resume tokens remain valid across elections.
   - The reproducible experiment (EL-012) is authoritative for **observed runtime behavior**: it shows tokens are invalidated after an election in certain configurations.

3. Per §5.1, these are different claim domains. The vendor doc prevails for *supported* API semantics; the experiment prevails for *observed* behavior. The conflict is recorded as a cross-domain discrepancy, not `BLOCKED_CONTRADICTION`.

4. A reproducible runtime experiment is documented, hashed, and stored as an evidence lock entry (`EL-012`, source class: `experiment`).

5. The discrepancy is escalated. Human approves an exception with rationale: "Runtime behavior confirmed via reproducible experiment; official docs claim supported behavior that does not hold in this configuration. Proceeding with observed behavior under documented risk."

6. Exception `EX-007` recorded as `experimental` type. Claim `C-055` status updated to `experimentally-observed`.

7. **Result**: `WAIVED` with recorded epistemic gap. The exception ledger notes the cross-domain discrepancy for future doc updates.

### 20.3 Refusal to proceed: Missing documentation for security-sensitive change

1. Change involves modifying authentication middleware. Classified as T3 (critical).

2. Evidence Scope triggers security domain. Knowledge Map requires threat modeling and auth standards.

3. No authoritative documentation found for the specific auth pattern being implemented. Search record shows: checked OWASP, checked framework docs, checked project ADRs — none cover this case.

4. Exception recorded as `unknown` type at T3 level.

5. **Result**: `BLOCKED_EVIDENCE_GAP`. T3 exception requires human approval. Cannot proceed until either:
   - Authoritative documentation is acquired
   - A human approves a waiver with explicit risk acceptance
   - A design tournament produces a grounded alternative with evidence

### 20.4 Circular self-justification detected

1. An agent writes a new ADR proposing "PaymentService is a domain service" and then cites that same ADR as evidence that its PaymentService implementation is correct.

2. The ADR has `independence: agent-authored-unapproved`.

3. Compliance Sweep detects: L0 source independence level is `agent-authored-unapproved`, which does not count as evidence.

4. **Result**: `NONCONFORMANT`. The ADR must be reviewed and approved by a human before it can serve as evidence, or an alternative authoritative source must be found.

### 20.5 Stale documentation and content drift

These are two distinct events:

**Event 1: Staleness (expired freshness)**

1. Evidence lock entry `EL-001` was retrieved 120 days ago. Freshness policy is 90 days.

2. A scheduled freshness check (V1) or drift detection (V3) detects the staleness.

3. The entry is flagged as `stale`. Claims depending on `EL-001` are flagged for re-verification.

4. The source is re-fetched. Content hash matches the locked hash — the content is unchanged. A new lock entry `EL-009` is created with a fresh `retrieved_at` timestamp, `supersedes: EL-001`, and claims are re-verified against the same content.

5. **Result**: `CONFORMANT` (content unchanged, freshness restored).

**Event 2: Content drift (hash mismatch)**

1. Evidence lock entry `EL-003` (Next.js docs, retrieved 60 days ago, freshness 90d) is re-fetched after a routine check.

2. Content hash has changed — the Next.js docs were updated.

3. A new lock entry `EL-010` is created with the new content, `supersedes: EL-003`.

4. Claims that depended on `EL-003` are compared against the new content:
   - If the new docs are **consistent** with existing claims: claims are re-verified and confirmed. Lifecycle state returns to `EVIDENCE_LOCKED`.
   - If the new docs **contradict** existing claims: those claims become `known-but-conflicting`. The change returns to `UNSCOPED` per the re-entry rule (§8.3).

5. **Result if consistent**: `CONFORMANT`. **Result if contradictory**: `BLOCKED_CONTRADICTION` or `UNSCOPED` for re-scoping.

### 20.6 Reverse-sweep discovery: Undocumented retry behavior

1. A change adds a new API endpoint for order status queries. During implementation, the agent adds automatic retry logic with exponential backoff for database calls — a behavior not in the evidence packet.

2. **Compliance Sweep — Reverse sweep**: The sweep detects a `consequential implementation behavior` (retry with backoff) that has no corresponding claim in the claim ledger.

3. The agent searches for authoritative documentation on retry patterns. Finds:
   - MongoDB docs (EL-008): recommends retry for transient errors
   - Project ADR-009: states "all database calls MUST use the retry policy from `lib/retry`"

4. Two outcomes:
   - **If evidence is found**: A new claim `C-061` is created ("Database calls MUST retry with exponential backoff on transient errors"), traced to EL-008 and ADR-009. The retry construct is now traced. Lifecycle continues to `VERIFYING`.
   - **If no evidence is found**: An exception `EX-012` (type: `unknown`) is recorded with a search record. If the retry behavior is `operational` kind with `high` impact (possible infinite loops, connection exhaustion), it escalates to T3 and the change moves to `BLOCKED_EVIDENCE_GAP` until evidence is acquired or a human approves a waiver.

5. **Result (evidence found)**: `CONFORMANT` with new claim `C-061` added. **Result (no evidence)**: `BLOCKED_EVIDENCE_GAP` or `WAIVED` with approved exception.

### 20.7 Design tournament: Caching strategy for product catalog

1. A change requires caching the product catalog. The decision is architecturally consequential (affects performance, consistency, and infrastructure), supported by multiple plausible approaches, and hard to reverse (cache invalidation logic permeates the codebase).

2. **Tournament triggered** (§10.1 criteria met).

3. **Design brief frozen**: Requirements (sub-100ms reads, 5-minute staleness acceptable), constraints (no new infrastructure in V1), evidence corpus (Redis docs, Next.js caching docs, project ADR-003 on infrastructure boundaries), risks (cache stampede, stale data).

4. **Three alternatives generated**:
   - **A (simplest viable)**: In-memory cache with TTL in the Next.js server component
   - **B (quality-optimized)**: Redis with tag-based invalidation
   - **C (hybrid)**: Stale-while-revalidate with ISR + on-demand revalidation

5. **Design cards produced** for each, with invariants, failure behavior, evidence citations, and operational consequences.

6. **Evaluation against predeclared criteria** (weighted before reveal):
   - Hard constraint: no new infrastructure → A and C pass; B fails (Redis is new infra)
   - Correctness: C > B > A (stale-while-revalidate handles invalidation)
   - Simplicity: A > C > B
   - Documentary support: C has strongest Next.js docs support (ISR is documented)

7. **Selected**: Alternative C (stale-while-revalidate with ISR). Rationale: satisfies the hard constraint, best balance of correctness and simplicity, strongest documentary support.

8. **Negative knowledge preserved**: ADR-012 records that B (Redis) was rejected because it violates the V1 infrastructure boundary constraint, and should be reconsidered when the project adopts Redis.

9. **Result**: Selected design enters implementation with grounded ADR. Tournament record stored in `.ddd/decisions/`.

### 20.8 Compiled control: Architecture boundary enforcement

1. ADR-004 establishes: "Order domain code must not import payment adapters." This is a control obligation.

2. **Obligation created**: `order.no-direct-payment-gateway` (see §12.1 schema). Scope: `src/domain/order/**`. Severity: blocking. Preferred enforcement: architecture-test.

3. **Adapter exists**: `dependency-cruiser` is a trusted adapter for the project's toolchain.

4. **Control compiled**: DDD generates a dependency-cruiser rule:
   ```json
   {
     "name": "order-no-payment-adapter",
     "severity": "error",
     "from": { "path": "src/domain/order/.*" },
     "to": { "path": "src/adapters/payment/.*" }
   }
   ```

5. **Control validated** (§12.4):
   - **Compliant fixture**: `src/domain/order/Order.ts` imports only from `domain/` → passes
   - **Violating fixture**: `src/domain/order/Order.ts` imports `PaymentGateway` from `adapters/payment` → fails with message: "Violates obligation: order.no-direct-payment-gateway"
   - **Mutation test**: deliberately adding the forbidden import → control catches it

6. **Enforcement level**: Level 4 (blocking automated gate). The rule runs in CI.

7. **Result**: Obligation `order.no-direct-payment-gateway` is `compiled` and enforced. Status tracked in `.ddd/obligations/`.

### 20.9 Incremental adoption: Change touches grandfathered code

1. A project has 50,000 lines of code, 80% grandfathered (pre-DDD). A new change modifies a file in the grandfathered region: `src/legacy/OrderProcessor.ts` is updated to add a new validation rule.

2. **Change scope defined** (§17.3):
   - Base revision: `commit:abc123`
   - Head revision: `commit:def456`
   - Changed symbols: `src/legacy/OrderProcessor.ts#validateOrder`
   - New dependencies: none
   - Transitively affected: `src/legacy/OrderRepository.ts` (calls `validateOrder`)
   - Materially modified: `src/legacy/OrderProcessor.ts#validateOrder` (implementation body changed)

3. **DDD scope determination**:
   - `validateOrder` is materially modified → enters DDD scope, MUST be traced
   - `OrderRepository` is only transitively affected (caller changed, own implementation unchanged) → flagged but not required to have full traceability
   - Other files in `src/legacy/` outside the change boundary → remain grandfathered

4. **Evidence gathered** for `validateOrder`: Project ADR-002 (validation patterns), domain model (Order invariants). Claims created: `C-070` (validateOrder must reject orders with mismatched totals).

5. **Reverse sweep** scope: limited to `validateOrder` and its callers within the change boundary. Does not sweep the entire `src/legacy/` directory.

6. **Coverage report**: This change covers 1 of 50 grandfathered symbols. Legacy debt: 49 symbols in `src/legacy/` remain grandfathered with known documentation gaps.

7. **Result**: `CONFORMANT` for the change. Project coverage: 20% DDD-governed, 80% grandfathered (documented in coverage report).

---

## Annex A: Skill Inventory

### A.1 Router

- **`ddd`** — determines the appropriate DDD operation and reports project status

### A.2 V1 skills

| Skill | Capabilities |
|---|---|
| `ddd-scope` | Classify the change, detect stack, enumerate dependencies, determine applicable knowledge domains, discover evidence, produce or refresh the evidence lock |
| `ddd-book` | Initialize (including stack detection), synchronize, validate, and release the Book. Manage Knowledge Map entries, project context, passports, and artifact references. |
| `ddd-ground` | Extract claims and obligations, create evidence packets, update construct mappings and passports |
| `ddd-verify` | Forward trace, reverse sweep, evidence entailment, gate and conformance audit |
| `ddd-exception` | Record, review, escalate, and resolve epistemic gaps |
| `ddd-model` | Create and maintain domain models (state machines, aggregates, entities, threat models, architecture models) in `.ddd/models/` |
| `ddd-audit` | Retroactively build a constitution draft for existing (brownfield) code by extracting claims, matching to docs, and flagging gaps |

### A.3 V2 skills

| Skill | Capabilities |
|---|---|
| `ddd-decide` | Run a grounded design tournament, produce the selected ADR and rejected alternatives |
| `ddd-refute` | Conduct independent adversarial review. MUST preserve genuine context and role independence. |

### A.4 V3 skills

| Skill | Capabilities |
|---|---|
| `ddd-controls` | Compile and validate Control Obligations into executable guardrails |
| `ddd-drift` | Detect evidence, documentation, decision, control, and code drift |

### A.5 Design notes

- Sub-operations (classify, discover, lock, sweep, audit, passport) remain independently machine-invocable
- Consolidating the public skills does not produce monolithic prompts
- Adapters are integrations, not skills
- A stable machine API beneath skills allows existing harnesses to invoke individual primitives

---

## Annex B: Research Foundations

This methodology is grounded in research and practice from:

- **Agent harness engineering** (Anthropic, Mitchell Hashimoto, Birgitta Böckeler/Martin Fowler)
- **Skills frameworks** (Matt Pocock skills, Superpowers/obra, Anthropic skills, Trail of Bits skills)
- **Spec-driven development** (GitHub Spec Kit, Kiro, Tessl, OpenSpec, BMAD Method)
- **Documentation grounding** (Context7/Upstash, Vercel AGENTS.md evals, DocPrompting, CloudAPIBench)
- **Requirements traceability** (NASA SWE-064/072, DO-178C, ReqToCode)
- **Formal verification** (proof-carrying code, Dafny, TLA+, Lean)
- **TDD for agents** (Probity, TDD Guard, TDAD, TiCoder)
- **Spec-to-code compliance** (Trail of Bits spec-to-code-compliance plugin)
- **Documentation-first traditions** (README Driven Development, Docs as Code, Literate Programming)

Key statistics motivating this methodology, with bibliographic provenance:

| Statistic | Source | Publication | URL | Date | Notes |
|---|---|---|---|---|---|
| GPT-4o: 38.58% valid API invocations on low-frequency APIs (documentation-augmented: 47.94%) | Jain et al. | "On Mitigating Code LLM Hallucinations with API Documentation" (CloudAPIBench) | https://arxiv.org/abs/2407.09726 | 2024-07 | Evaluated API invocation correctness on low-frequency APIs; documentation augmentation improved but did not eliminate errors |
| 19.7% of generated package references are hallucinated (440,445 of 2.23M) | Spracklen et al. | "We Have a Package for You! Package Hallucinations in Code Generated by Large Language Models" | https://arxiv.org/abs/2406.10279 | 2024-06 | Measured package hallucination rate across multiple LLMs and programming languages |
| DocPrompting: 52% relative improvement in pass@1 with documentation | Zhou et al. | "DocPrompting: Eliciting Documentation-Centric Code Generation from Language Models" | https://arxiv.org/abs/2207.05987 | 2022-07 | Documentation retrieval + generation improved code correctness by 52% relative over baseline |
| Vercel: 8KB AGENTS.md doc index scored 100% on Next.js evals vs. 79% for skills | Vercel engineering | "AGENTS.md outperforms skills in our agent evals" | https://vercel.com/blog/agents-md-outperforms-skills-in-our-agent-evals | 2025 | Internal evaluation of compact documentation index vs. full skills approach on Next.js framework tasks |

**Limitations:** These statistics are drawn from specific models, datasets, and evaluation conditions. They illustrate the problem space but should not be treated as universal constants. Model improvements may reduce hallucination rates over time; the methodology's value lies in systematic verification, not in any specific rate.

---

## Changelog

| Version | Date | Changes |
|---|---|---|
| 0.1.0-draft | 2026-08-29 | Initial draft from grilling session with two-agent ping-pong |
| 0.2.0-draft | 2026-08-29 | Applied 6 blocking corrections from collaborator review: T3/Profile/Rollout consistency, two-axis risk classification (claim_kind + impact), claim-scoped authority, lifecycle transition table, normative artifact schemas, change scope/grandfathering semantics. Added risk rubric, security containment language, research citations, 4 missing worked examples. Fixed 3 worked example contradictions. |
| 0.2.1-draft | 2026-08-29 | Applied 6 freeze blockers from collaborator verification: corrected Annex B citations to accurate arXiv IDs, fixed §20.2 as cross-domain discrepancy (not same-authority contradiction) with explicitly fictional example, normalized all YAML schemas to valid syntax with consistent schema_version placement, added Assurance Review preconditions to lifecycle transitions, completed risk derivation function with full kind/impact matrix, reconciled V1 enforcement wording (reverse sweep enforcement mode not mandatory automation, T0 scope record allowed at Evidence Lock gate). Fixed T2 exception approval consistency. |
| 0.2.2-draft | 2026-08-29 | Applied 4 final freeze blockers: fixed risk derivation prose to match matrix (api raises to T1, operational always at least T2), added T0-only scope record to lifecycle EVIDENCE_REQUIRED→EVIDENCE_LOCKED transition, reconciled §13.1 traceability requirement with §14 exceptions (L1 claim MUST trace to L0 source OR explicit exception), added schema_version to Book manifest. |
| 0.2.3-draft | 2026-08-29 | Applied 5 final freeze blockers: updated §4.2 mandatory kernel to allow T0-only scope record in place of evidence packet, propagated T0 path through EVIDENCE_LOCKED state and IMPLEMENTING transition, added normative T0 scope record schema (§7.6.1a), fixed §7.4 claim example tier (api+medium=T1 not T2), clarified digest field names as artifact-specific (manifest_digest/content_digest/packet_digest), aligned §5.2 source schema fields with §7.3 example (product+version not product_version), made VERIFYING→WAIVED actor profile-dependent (agent reviewer for T2 in Lite, Human Approver for T3 in all profiles). |
| 0.2.4-draft | 2026-08-29 | Applied 4 final freeze blockers: added T0 alternative to IMPLEMENTING→VERIFYING transition, clarified T0-only means all claims derive to T0 after classification (not just mechanical kind), defined lifecycle behavior for non-blocking T0/T1 exceptions (remain in current state, do not prevent CONFORMANT), made content_digest required for project-doc sources to comply with §5.4 durable-citation requirement. |
| 0.2.5-draft | 2026-08-29 | Applied 3 final freeze blockers: fixed CONFORMANT definition to permit T0/T1 non-blocking exceptions, revised §5.4 to accept repository_path+commit or experiment_result_hash as version record for project-doc and experiment sources (not just version field), added t0_classification (claim_kind, impact, derived_tier) to T0 scope record schema for auditability. |
| 0.2.6-draft | 2026-08-29 | Aligned §5.2 provenance table with §5.4: version now required for standard sources, doc_version now required for project-doc sources. |
| 0.3.0-draft | 2026-08-30 | Major update from adversarial review (5 devil's advocate subagents). Added: §4.2.2 T1 fast path, §5.1 cross-document constraints and dependency version conflict claim domains, §5.2 code-derived source class, §7.2 project_context and constraints pointers, §7.6.11 project context record, §7.6.12 domain model record, §7.6.13 cross-document constraint record, §9.1 expanded taxonomy (10→18 dimensions), §9.1a taxonomy extension process, §9.7 expanded adapters + cache policy + access-control provenance, §9.8 stack detection, §9.9 dependency enumeration, §9.10 tribal knowledge elicitation, §9.11 code-derived artifacts as L0 evidence, §9.3 knowledge map package linking fields, §13.4 operationalized citation entailment procedure, §13.6 test-code traceability, §14.5 claim retraction, §17.4 monorepo scoping, §17.5 incident/postmortem feedback loop, §7.7 README/onboarding governance. Added ddd-model and ddd-audit skills to Annex A. |
