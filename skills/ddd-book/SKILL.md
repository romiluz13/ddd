---
name: ddd-book
description: >
  Use only when explicitly asked to initialize or maintain the optional
  experimental Proofline CLI Book, references, or compatibility artifacts.
metadata:
  author: ddd-methodology
  version: "0.7.4"
---

# Manage Proofline storage

This is optional experimental tooling, outside the default DDD route. For an
ordinary coding task or missing documentation, follow [DDD](../ddd/SKILL.md).
A `.ddd/notes/` task note does not require Book initialization.

Proofline retains `.ddd/` as its compatibility store. In the tooling repository,
read `cli/README.md` and `cli/SPEC.md` for commands, known defects, and schemas;
the root specification describes the methodology. Locate those files in the
tooling checkout when this skill is installed in another project.

## Initialize

Create:

```text
.ddd/
├── book.yaml
├── evidence.lock
├── claims.yaml
├── trace-matrix.yaml
├── cases/
├── packets/
├── reports/
└── cache/
```

Use `schema_version: 0.1.0` for legacy YAML artifacts and `0.5.0` for change
envelopes, assurance cases, and assurance reports.

## Validate

1. Confirm every path referenced by `book.yaml` exists.
2. Recompute referenced document and cache digests.
3. Reject active claims that cite revoked or missing evidence.
4. Confirm trace claim IDs exist.
5. Confirm every case uses a supported schema version.
6. Report missing or unevaluated material instead of inferring it.

The step is complete when all checked references resolve and every unchecked
area is named.

## Synchronize

Update `book.yaml` pointers when a supported artifact is added. Keep the Book as
an index, not a duplicate of source documents.

Object passports, domain models, control obligations, broad artifact inventory,
and federation remain archived research. Their old schemas are preserved under
`research/` and are not required for current conformance.
