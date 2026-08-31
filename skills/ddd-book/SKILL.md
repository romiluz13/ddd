---
name: ddd-book
description: >
  Use when initializing or validating Proofline compatibility storage, updating
  Book references, or repairing evidence, claims, traces, cases, and reports.
metadata:
  author: ddd-methodology
  version: "0.4.0"
---

# Manage Proofline storage

Proofline retains `.ddd/` as its compatibility store.

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

Use `schema_version: 0.1.0` for legacy YAML artifacts and `0.4.0` for change
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
