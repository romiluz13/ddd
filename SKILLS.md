# Proofline skills manifest

The active skill surface supports the external-evidence workflow. The
assurance-case kernel is exposed through the CLI while its agent workflow is
validated.

## Supported skills

| Skill | Completion criterion | Implemented CLI |
|---|---|---|
| `ddd` | Routes to one supported operation and reports unsupported branches honestly. | All routing |
| `ddd-scope` | Required external sources are versioned, captured, and locked. | `classify`, `lock` |
| `ddd-ground` | Claims cite locked evidence and declared constructs have traces. | `claim`, `packet`, `trace` |
| `ddd-verify` | The declared graph is evaluated and its scope is named. | `sweep`, `evaluate-case` |
| `ddd-book` | Compatibility storage exists and referenced artifacts validate. | Infrastructure |
| `ddd-exception` | A gap or residual risk is explicit and accountable. | No command; `exception` is a stub |

## Assurance-case CLI

| Command | Status | Capability |
|---|---|---|
| `scope-change` | Experimental | Git base/head boundary, TypeScript declarations, OpenAPI and JSON Schema contracts |
| `build-case` | Experimental | Typed graph construction from evidence, claims, traces, and changed symbols |
| `evaluate-case` | Experimental | Acyclicity, lineage, admissibility, coverage, capability, defeater, and waiver policy |

The evaluator returns `SATISFIED`, `UNSATISFIED`, `INDETERMINATE`, or `WAIVED`.
Every verdict includes boundary confidence and capability coverage.

## Research skills

The following skills are preserved in `research/skills/` and are not distributed
as supported product behavior:

- `ddd-model`
- `ddd-audit`
- `ddd-decide`
- `ddd-refute`
- `ddd-controls`
- `ddd-drift`

The evidence-freshness `drift-check` CLI command remains supported. It does not
implement the archived seven-dimensional drift design.

## Unsupported machine primitives

`discover`, `refute`, `exception`, `obligation`, and `compile` are explicit
stubs. A stub does not satisfy a workflow gate.

See [`SPEC.md`](SPEC.md) for the supported boundary and
[`research/SPEC-0.3.md`](research/SPEC-0.3.md) for superseded research.
