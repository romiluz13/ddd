---
name: ddd-ground
description: >
  Use after external evidence is locked to record atomic claims, build a bounded
  packet, trace changed constructs, or build a Proofline assurance case.
metadata:
  author: ddd-methodology
  version: "0.5.0"
---

# Ground a change

**Every supported claim cites locked evidence. Every declared construct has a
trace.**

## Record claims

For each external API statement used by the implementation:

```sh
ddd claim "<statement>" \
  --source "EL-NNN#section" \
  --authority <domain> \
  --kind <kind> \
  --impact <impact> \
  --entailment <explicit|implicit|paraphrase> \
  --construct "<path#symbol>"
```

Keep each claim atomic. `--entailment` is a verifier attestation, not an
automatic semantic proof.

## Build the bounded packet

```sh
ddd packet <change-id> --claims <C-NNN,...> --max-chars <limit>
```

The packet is complete when it contains only the claims and immutable cached
evidence required by the change.

## Trace implementation

```sh
ddd trace <C-NNN> "<path#symbol>"
```

A trace declares coverage; it does not prove that all repository behavior was
discovered. Use `scope-change` to create an independently generated denominator
for the supported TypeScript boundary.

## Build an assurance case

```sh
ddd build-case <ENV-NNN>
```

The builder maps:

- active external evidence to contract or observation nodes;
- supported claims to requirement nodes;
- changed symbols to implementation nodes;
- declared traces to `implements` edges;
- source citations to `supports` edges;
- OpenAPI and JSON Schema files to descriptive contract nodes.
- `.ddd/stack.yaml` components to required stack-coverage capabilities;
- Book external references to their exact locked evidence;
- knowledge-map gaps to defeaters;
- platform constraint references and cross-layer interactions to explicit
  capability results.

The step is complete when every goal and changed symbol appears in
`.ddd/cases/CASE-NNN.json`, every declared stack component cites locked
evidence whose subject and dependency version match, and no unresolved gap is
hidden.

## Boundaries

Control compilation, object passports, automatic obligation extraction, and
broad internal-artifact discovery are research. Do not route to archived skills
as if they were supported gates.
