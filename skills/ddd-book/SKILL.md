---
name: ddd-book
description: >
  Initialize, synchronize, validate, and release the DDD Project Engineering Book.
  Manages the Book manifest, project context (tech stack detection), Knowledge Map,
  object passports, and artifact references. Use when initializing DDD on a new project,
  adding or updating Book references, releasing a Book version, or managing object passports.
metadata:
  author: ddd-methodology
  version: "0.3.0"
---

# ddd-book

**THE BOOK IS THE SOURCE OF TRUTH. IF IT'S NOT IN THE BOOK, IT DOESN'T EXIST.**

Initialize, synchronize, validate, and release the Project Engineering Book. Detect project stack, manage project context, Knowledge Map, passports, and artifact references.

## When to invoke

- Initializing DDD on a new project (`.ddd/` does not exist)
- Adding or updating references in the Book manifest
- Releasing a new Book version
- Managing object passports
- Synchronizing the Book with existing project artifacts (ADRs, CONTEXT.md, AGENTS.md)
- Validating Book integrity
- When the project stack changes (new dependency, framework upgrade, database change)

## What it does

### Initialize

1. Create `.ddd/` directory structure (see SPEC.md §7.1 for layout)
2. Create initial `book.yaml` manifest with `schema_version: 0.1.0`
3. **Detect and record project stack** — scan manifest files, lockfiles, config files. **See `references/stack-detection.md`** (in `ddd-scope`) for the full procedure. Populate `.ddd/project-context.yaml`. NEVER guess from parametric memory.
4. Index existing project artifacts (requirements, ADRs, CONTEXT.md) as Book references with independence levels
5. Generate initial `knowledge-map.yaml` with domains derived from detected stack
6. Determine conformance profile (Lite or Assurance)

### Synchronize

1. Scan for new or updated ADRs, requirements, and project docs
2. Re-scan project stack if dependencies or config files changed — update `project-context.yaml`, flag dependencies without matching evidence lock entries
3. Update Book manifest references with correct independence levels
4. Regenerate `trace-matrix.yaml` as a view of the evidence graph

### Validate

1. Check every Book reference exists and is accessible
2. Check evidence lock entries have valid content digests
3. Check no revoked entries are still cited in claims
4. Check supersession chains are consistent
5. Check `project-context.yaml` is current — compare detected stack against recorded stack, flag drift
6. Check all dependencies used by DDD-governed code have evidence lock entries

### Release

1. Compute manifest digest (sha256 of all referenced artifact digests)
2. Tag the Book version (semver)
3. Validate all referenced artifacts before release

### Manage passports

Create and update object passports for responsibility-bearing design units. **See `references/passport-schema.md`** for the full schema and passport-required criteria.

Passports SHOULD reference domain models via `domain_sources` when a model exists.

## Artifacts managed

| Artifact | Location | Purpose |
|---|---|---|
| Book manifest | `.ddd/book.yaml` | Root of the Book, indexes all artifacts |
| Project context | `.ddd/project-context.yaml` | Governed tech stack, runtime, dependencies, architecture |
| Knowledge Map | `.ddd/knowledge-map.yaml` | Relevant engineering domains, gaps, and package links |
| Evidence lock | `.ddd/evidence.lock` | Immutable external-source provenance |
| Claim ledger | `.ddd/claims.yaml` | Atomic assertions requiring support |
| Trace matrix | `.ddd/trace-matrix.yaml` | Generated view of evidence graph |
| Passports | `.ddd/passports/` | Object design contracts |
| Decisions | `.ddd/decisions/` | DDD decisions (ADRs) |
| Models | `.ddd/models/` | Domain, state, threat, architecture models |

## Good vs bad initialization

**Good**:
```
Stack detection: package.json → next@15.1.0, package-lock.json → exact versions
project-context.yaml: { language: TypeScript, framework: Next.js 15.1.0, database: PostgreSQL 16 }
Independence levels: ADR-007 → project-authoritative, vendor docs → external-authoritative
Profile: Lite (no T3 claims expected)
```

**Bad**:
```
Stack detection: "It's a React app" (from memory, no file scan)
project-context.yaml: { language: JavaScript, framework: React } (no versions)
Independence levels: all "agent-proposed" (no authority distinction)
Profile: unset
```

## Rationalization table

| Excuse | Reality |
|---|---|
| "I can initialize without stack detection" | Stack detection drives evidence acquisition, drift detection, and adapter selection. Skip it and every downstream skill has garbage input. |
| "The Book doesn't need validation, I just created it" | New Books can have broken references, missing evidence lock entries, and stale constraints. Validate after every change. |
| "Passports are overkill for this component" | If it owns state, crosses a boundary, or has high failure impact, it needs a passport. Check the criteria in `references/passport-schema.md`. |
| "I'll update project-context.yaml later" | Every skill reads it. If it's stale, evidence acquisition uses wrong versions, drift detection produces false positives, and grounding traces to wrong APIs. |

## Self-improvement

1. Did Book validation surface any issues? If yes, the synchronization step missed something — improve the sync scan.
2. Are there artifacts in `.ddd/` not referenced by `book.yaml`? If so, the manifest is incomplete — add them.
3. Did stack detection produce `unknown` fields that could have been detected? Improve the detection logic or add config file patterns.

## Spec reference

- SPEC.md §7 (Artifacts), §9.8 (Stack detection), §11 (Object Passports), §17 (Versioning and Migration)
