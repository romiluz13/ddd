---
name: ddd
description: >
  Route Proofline work when starting a change, grounding external API usage,
  evaluating a change-assurance case, checking declared conformance, or asking
  which Docs-Driven Development step comes next.
metadata:
  author: ddd-methodology
  version: "0.4.0"
---

# Proofline router

**Name the boundary. Preserve lineage. Never turn unevaluated into green.**

Proofline supports external API evidence today and experiments with
change-bounded assurance for TypeScript, OpenAPI, and JSON Schema.

## Route the request

1. Read `.ddd/book.yaml`. If it is absent, route to `ddd-book`.
2. For a new external dependency or API usage, route to `ddd-scope`.
3. When evidence is locked and claims or traces are missing, route to
   `ddd-ground`.
4. When implementation is complete, route to `ddd-verify`.
5. When authoritative evidence is unavailable or residual risk needs approval,
   route to `ddd-exception`.
6. For the experimental change-assurance path, run:

   ```sh
   ddd scope-change --base <revision> --head <revision>
   ddd build-case <ENV-NNN>
   ddd evaluate-case <CASE-NNN>
   ```

The route is complete only when the next operation and its current boundary are
explicit.

## Interpret results

- `CONFORMANT_DECLARED_SCOPE` covers only constructs declared in Book artifacts.
- `SATISFIED` covers only the symbols in the reported change envelope.
- `INDETERMINATE` is incomplete evaluation, not partial success.
- `WAIVED` records accepted residual risk, not correctness.
- Semantic entailment is a recorded attestation.
- Evidence freshness is the only implemented drift dimension.

## Unsupported branches

Domain modeling, brownfield audit, design tournaments, adversarial refutation,
control compilation, broad drift, object passports, and federation are
research. Their archived skills under `research/skills/` are reference material,
not workflow gates.

The `discover`, `refute`, `exception`, `obligation`, and `compile` machine
commands are stubs. Report that status instead of simulating completion.

## Output

```yaml
product: proofline
storage: .ddd
supported_boundary: external-api-evidence
experimental_boundary: typescript-openapi-json-schema
current_operation: scope-change
next_action: "Build ENV-001 into an assurance case"
verdict: null
limitations:
  - semantic-entailment-is-attested
  - unsupported-files-lower-boundary-confidence
```

## Reference

- `SPEC.md`: supported kernel and assurance invariants.
- `GETTING_STARTED.md`: executable workflow.
- `research/SPEC-0.3.md`: superseded broad methodology.
