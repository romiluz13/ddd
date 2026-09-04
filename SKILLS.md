# Proofline skills manifest

The active skill surface supports the external-evidence workflow. The
assurance-case kernel is exposed through the CLI while its agent workflow is
validated.

## Supported skills

| Skill | Completion criterion | Implemented CLI |
|---|---|---|
| `ddd` | Routes to one supported operation and reports unsupported branches honestly. | All routing |
| `ddd-scope` | Dependencies, services, platforms, frontend layers, and required evidence are inventoried. | `classify`, `lock`, `scope-change` |
| `ddd-ground` | Claims and every stack component cite locked evidence; open gaps remain blocking. | `claim`, `packet`, `trace`, `validation`, `build-case` |
| `ddd-verify` | The declared graph, stack coverage, constraints, and interactions are evaluated. | `sweep`, `evaluate-case`, `doctor` |
| `ddd-book` | Compatibility storage exists and referenced artifacts validate. | Infrastructure |
| `ddd-exception` | A gap or residual risk is explicit, accountable, and time-boxed. | `goal`, `exception`, `obligation` |

## Assurance-case CLI

| Command | Status | Capability |
|---|---|---|
| `scope-change` | Experimental | Git boundary, declarations, manifest dependencies, services, platforms, frontend files, and explicit contracts |
| `build-case` | Experimental | Typed graph plus stack, reference, gap, platform-constraint, frontend, and interaction checks |
| `evaluate-case` | Experimental | Acyclicity, lineage, admissibility, coverage, capability, defeater, and waiver policy |
| `doctor` | Supported | Repository-local installed-skill drift detection |

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

`discover`, `refute`, and `compile` are explicit
stubs. A stub does not satisfy a workflow gate.

See [`SPEC.md`](SPEC.md) for the supported boundary and
[`research/SPEC-0.3.md`](research/SPEC-0.3.md) for superseded research.
