---
name: ddd-book
description: >
  Initialize, synchronize, validate, and release the DDD Project Engineering Book.
  Manages the Book manifest, Knowledge Map, object passports, and artifact references.
  Use when initializing DDD on a new project, adding or updating Book references,
  releasing a Book version, or managing object passports.
metadata:
  author: ddd-methodology
  version: "0.2.6"
---

# ddd-book

**Initialize, synchronize, validate, and release the Project Engineering Book. Manage Knowledge Map entries, passports, and artifact references.**

## When to invoke

- Initializing DDD on a new project (`.ddd/` does not exist)
- Adding or updating references in the Book manifest
- Releasing a new Book version
- Managing object passports
- Synchronizing the Book with existing project artifacts (ADRs, CONTEXT.md, AGENTS.md)
- Validating Book integrity

## What it does

### Initialize

1. Create `.ddd/` directory structure:
   ```
   .ddd/
     book.yaml
     knowledge-map.yaml
     evidence.lock
     claims.yaml
     trace-matrix.yaml
     decisions/
     models/
     passports/
     obligations/
     packets/
     exceptions/
     reports/
     cache/
   ```
2. Create initial `book.yaml` manifest with `schema_version: 0.1.0`
3. Index existing project artifacts (requirements, ADRs, CONTEXT.md) as Book references with independence levels
4. Generate initial `knowledge-map.yaml`
5. Determine conformance profile (Lite or Assurance)

### Synchronize

1. Scan for new or updated ADRs, requirements, and project docs
2. Update Book manifest references with correct independence levels:
   - `external`: vendor docs, standards, published books
   - `human-authored`: human-written project docs, requirements
   - `agent-proposed-human-approved`: agent authored, human approved
   - `agent-authored-unapproved`: agent authored, not yet approved (does NOT count as evidence)
3. Update `AGENTS.md` as a compact runtime index generated from the Book
4. Regenerate `trace-matrix.yaml` as a view of the evidence graph

### Validate

1. Check every Book reference exists and is accessible
2. Check evidence lock entries have valid content digests
3. Check no revoked entries are still cited in claims
4. Check supersession chains are consistent
5. Check manifest digest matches content

### Release

1. Compute manifest digest (sha256 of all referenced artifact digests)
2. Tag the Book version (semver)
3. A code revision MAY declare which Book version governed it

### Manage passports

Create and update object passports (SPEC.md §11) for responsibility-bearing design units:

**Passport required when a unit:**
- Owns domain meaning or invariants
- Owns mutable state or a lifecycle
- Crosses a trust, process, or data boundary
- Exposes a stable interface
- Persists data or events
- Performs irreversible side effects
- Coordinates multiple components
- Has high coupling or high failure impact

**Passport schema** (see SPEC.md §11.2):
```yaml
id: order.aggregate
kind: aggregate
purpose: Protect the consistency of an accepted order
domain_sources: [CONTEXT.md#Order, EL-002#domain-model]
responsibilities: [...]
non_responsibilities: [...]
invariants: [...]
states: [...]
collaborators: [...]
allowed_dependencies: [...]
forbidden_dependencies: [...]
methodology: { pattern, source, applicability_rationale }
risks: [...]
controls: [...]
validating_tests: [...]
symbols: [...]
```

DTOs, trivial helpers, generated types, and framework glue inherit coverage from a parent passport.

## Artifacts managed

| Artifact | Location | Purpose |
|---|---|---|
| Book manifest | `.ddd/book.yaml` | Root of the Book, indexes all artifacts |
| Knowledge Map | `.ddd/knowledge-map.yaml` | Relevant engineering domains and gaps |
| Evidence lock | `.ddd/evidence.lock` | Immutable external-source provenance |
| Claim ledger | `.ddd/claims.yaml` | Atomic assertions requiring support |
| Trace matrix | `.ddd/trace-matrix.yaml` | Generated view of evidence graph |
| Passports | `.ddd/passports/` | Object design contracts |
| Decisions | `.ddd/decisions/` | DDD decisions (ADRs) |
| Models | `.ddd/models/` | Domain, state, threat, architecture models |

## Existing artifact relationships

| Artifact | Relationship |
|---|---|
| `CONTEXT.md` | Discovery workspace; becomes authoritative when referenced in Book with independence level |
| ADRs | First-class Book decisions, referenced by manifest |
| `AGENTS.md` | Compact runtime index generated from the Book |
| Existing project docs | Remain canonical, referenced not copied |
| Database/vector store | Rebuildable retrieval cache, never source of truth |

## Spec reference

- SPEC.md §4.3 (State sharing), §7 (Artifacts: §7.1 directory structure, §7.2 Book manifest schema, §7.7 artifact relationships), §11 (Object Passports), §17 (Versioning and Migration: §17.1 spec versioning, §17.2 schema versioning, §17.3 incremental adoption)
