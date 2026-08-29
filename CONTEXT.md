# Context: DDD — Docs-Driven Development

## Glossary

### Docs-Driven Development (DDD)
An agentic engineering methodology in which approved, versioned documentation drives the engineering process: knowledge discovery, method selection, system design, object responsibilities, executable constraints, implementation context, and verification. Not to be confused with Domain-Driven Design (Eric Evans, 2003).

### Engineering Intelligence Plane
The architectural concept that DDD operates as: a shared services layer that existing workflows call into at lifecycle events, rather than owning the product development lifecycle.

### Project Engineering Book
The federated, Git-versioned, manifest-rooted set of authoritative engineering artifacts for a project. Not a single document. Lives in `.ddd/`.

### Evidence Lock
An immutable, content-addressed record of acquired external sources with full provenance (URL, version, hash, timestamp, trust tier).

### Claim
An atomic, normative statement extracted from a source, requiring support. Has an ID, rationale, source citation, tier, and linked constructs.

### Construct
A code element (class, function, module, boundary, data model) that implements a claim.

### Object Passport
A durable design contract for a responsibility-bearing engineering unit. Contains purpose, domain concept, responsibilities, invariants, lifecycle, collaborators, dependencies, methodology, risks, and validating tests.

### Evidence Packet
A bounded, change-specific context bundle containing the claims, evidence, passports, and controls relevant to one implementation task.

### Control Obligation
A target-agnostic, machine-readable rule extracted from documentation, to be compiled into an executable guardrail by a toolchain adapter.

### Epistemic Gap
A known unknown, conflict, or unsupported state that is explicitly surfaced, classified, and handled. Legitimate states include: known-and-supported, known-but-conflicting, unknown, unsupported, experimentally-observed, human-approved-exception, blocked-pending-evidence.

### Consequential Claim
A claim whose failure would affect externally observable behavior, architectural integrity, security, data integrity, or operational correctness.

### Design Tournament
A structured, evidence-grounded evaluation of 2-3 competing design alternatives for consequential, uncertain, or hard-to-reverse decisions. Produces a selected design with rationale and rejected alternatives as negative knowledge.

### Knowledge Map
A persistent record of which engineering knowledge domains are relevant to the project, with applicability hypotheses and gaps.

### Proof Tier
Risk-based traceability level: T0 (mechanical), T1 (API), T2 (behavioral), T3 (critical). Determines what evidence and validation are required.

### Independence Level
Classification of an L0 source's authorship: external, human-authored, agent-proposed-human-approved, agent-authored-unapproved. Only the first three count as evidence.

## Decisions

See `docs/adr/` (to be created when ADRs are needed).
