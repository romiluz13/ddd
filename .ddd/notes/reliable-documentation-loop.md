# Reliable documentation loop

Status: methodology edits prepared for the user-authorized 0.7.2 release.
Automatic-workflow acceptance remains unmet; do not claim agent reliability fixed.

## Task and plan

The user approved a small, autonomous five-action workflow: inspect the task and
its surroundings, research concrete questions, maintain one persistent task note,
implement with renewed research on failed assumptions, then compare actual code
and checks against sources. Keep the large supplied taxonomy as inspiration for
selecting sources, not a new graph, registry, or mandatory document inventory.

1. Rewrite the main skill and align phase wrappers and existing supporting refs.
2. Update the methodology contract and public guidance for persistence, relevance,
   error-driven research, and explicit limits on what source/test evidence proves.
3. Exercise ordinary task activation, spontaneous storage, unexpected failure,
   and resumption through an installed coding-agent host in disposable projects.
4. Inspect actual tool calls/files and run native checks; refresh repository-local
   copies, lock hashes and Book digests, then run the existing repository gates.

## Documentation basis

- Agent Skills: current unversioned [format](https://agentskills.io/specification)
  and [host integration](https://agentskills.io/client-implementation/adding-skills-support),
  read 2026-09-06. Skills retain name/description frontmatter, string metadata,
  relative resource links. Host discovery and activation must be tested separately
  from an instruction file's contents; .ddd storage alone does not activate a skill.
- Product authority: the user's accepted five-action design in this conversation.
  Technology source material informs usage; observed code/tests do not establish
  desired behavior. No runtime dependencies or CLI schema changes are planned.
- Local compatibility rules: cli/src/doctor.ts hashes file paths plus bytes per
  skill folder; cli/src/sweep.ts validates Book artifact digests and its canonical
  digest list. These are existing maintenance operations, outside ordinary DDD use.
- Host: Factory Droid 0.213.0, default gpt-5.6-sol/medium; project skill copies,
  ordinary prompts, and fresh processes. Official Factory skills, headless CLI,
  and AGENTS discovery docs were read, then actual tool calls inspected.
- Integration snippets: this change edits Markdown instructions, not application
  APIs. Walkthrough task plans must contain their own grounded snippets.
- Findings changed the instructions: source reads for each technology question;
  results stay pending until execution returns; explicit post-edit file/source
  reads precede recording the comparison. This addresses observed prefilled
  success claims without adding another tool, record type, or approval stage.

## Actual validation and remaining work

See the [installed-host record](host-workflow-walkthrough.md) for all attempts,
including failures. Final Python code passes 2 tests; TypeScript passes 8 behavior
checks and resumes its automatically saved note; unavailable docs leave the
fixture stub unchanged with specific gaps. However, ordinary host runs sometimes
skip DDD, and even explicitly activated runs omit source reads or overstate the
final comparison. The product's reliable automatic behavior is still unproven.

Repository checks executed:

- `(cd cli && bun test)`: exit 0; 93 pass, 0 fail, 352 assertions.
- `bun run cli/bin/ddd.ts --help`: exit 0; preserved CLI interface.
- `bun run cli/bin/ddd.ts doctor`: exit 0; six local copies/hashes current.
- Sweep in a disposable `.ddd` copy: exit 0, CONFORMANT_DECLARED_SCOPE, three
  claims and three traces. This is not repository-wide conformance.
- CASE-002 in that disposable copy: expected exit 1, INDETERMINATE, partial
  boundary and consumer_impact unevaluated. Historical report untouched.
- Changed skill metadata and local Markdown links checked; `git diff --check`
  clean. Two independent read-only reviews completed. Contract review found no
  actionable contradiction. Evidence review corrected the record: a script did
  read back app.py, one run wrote an out-of-scope empty scratch file, and two
  final notes overstated additional source rereads. Those limitations remain open.
- Final format comparison reopened Agent Skills' specification and integration
  guide: names/descriptions, string metadata, relative references and separation
  of activation from instruction following remain compatible.

The main skill, phase wrappers, supporting guidance and public contract agree on
one persistent task note, task-specific source selection, existing authorization,
failure-driven research and actual comparison. CLI code, schemas, historical
reports/research and unrelated untracked work remain untouched. Repository-local
skill copies and Book digests were refreshed; no global configuration was edited.

Second-host discovery: Codex CLI 0.153.4 loaded DDD but also a personal brainstorming
skill and stopped for routine design approval, without research or a saved note.
The public one-time project instruction now explicitly loads ddd before planning
or editing and makes it the workflow authority. Other skills provide technical
guidance within the user's existing authorization. The main skill, SPEC and root
AGENTS reflect this same boundary. Codex then continued through actual source
reads, implementation and final comparison without another approval. Droid also
activated DDD on the ordinary task in its rerun, but still omitted SQLite sources.

Codex's search-enabled run attempted remote official source through an MCP tool;
that call required approval unavailable under its `never` policy. It used shipped
source/docstrings and explicitly identified runtime probes as fallback. Parent
verification passed 2 Python tests and compilation. This is not proof of a working
online-doc channel in that host. All walkthrough processes and bounded follow-up
reviews finished. The authorization amendment is consistent; the evidence record
now distinguishes invoked comparison reads from missing returned excerpts and
does not infer pre-edit note contents from a later saved version.

The initial implementation stopped before publication. The user subsequently
explicitly requested a version bump, push and refresh of DDD installations across
this Mac. Release 0.7.2 carries the improvements and the recorded limitations;
reliable automatic acceptance remains unmet despite passing native and
compatibility checks. Publishing does not turn these walkthrough failures into
passes. Release verification includes remote CI, a fresh public skill download,
and comparison of active local installations with that published revision.
