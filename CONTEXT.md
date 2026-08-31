# Proofline context

## Product

**Proofline** is a change-assurance tool. The `ddd` command and `.ddd/` storage
remain compatibility interfaces from the earlier Docs-Driven Development name.

The supported product grounds declared external API and protocol usage in
immutable, version-matched evidence. The experimental kernel evaluates typed
assurance cases over Git-bounded TypeScript changes and explicit OpenAPI or JSON
Schema contracts.

## Glossary

### Change envelope

The base and head revisions, changed files and symbols, affected contracts,
known consumers, exclusions, risk, owner, and boundary confidence for one
change.

### Assurance case

A typed graph connecting goals, contracts, implementation, observations,
validations, decisions, and exceptions.

### Epistemic role

How a node participates in an assurance argument: normative, descriptive,
observation, validation, implementation, or waiver. This role is independent
of whether the source is external, project-local, generated, runtime, or human.

### Derivation lineage

The transitive `derived_from` relationship. It prevents generated schemas,
tests, or documents from proving the implementation that produced them.

### Boundary confidence

`complete`, `partial`, or `unknown`, based on the supported detector's ability
to enumerate the changed surface.

### Defeater

A contradiction, missing premise, or unresolved unknown that blocks an
unqualified verdict.

### Waiver

Human acceptance of named residual risk. A waiver does not establish
correctness.

### Evidence lock

An immutable record of an external source's exact content, version, digest, and
provenance.

### Claim

An atomic normative statement with a source citation and declared constructs.

### Declared-scope sweep

The compatibility verifier over constructs named in claims and traces. It does
not discover a repository-wide denominator.

## Decisions

- Keep the external-documentation kernel as the supported product.
- Preserve epistemic distinctions as evaluator invariants.
- Test the broader change-assurance architecture through one
  TypeScript/OpenAPI/JSON Schema slice.
- Preserve the superseded broad methodology under `research/`.
- Use Proofline as the working product name before wider adoption.
