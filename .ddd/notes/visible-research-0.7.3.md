# Visible research and consistent continuation

Status: scoped 0.7.3 changes implemented and verification recorded. Host
limitations remain as described below.

## Task and plan

The user approved three focused improvements: explicit DDD activation in MD brain,
visible research updates from the coordinating agent, and one task note connecting
sources, implementation decisions and actual verification. Preserve ongoing MD brain
application work, CLI behavior, historical evidence, and local skill customizations.

1. Amend the existing DDD steps and public project instruction; align phase wrappers.
2. Add the project instruction to MD brain's AGENTS.md and CLAUDE.md.
3. Run fresh installed-host walkthroughs for ordinary activation, visible source
   status, continuation and handling unsupported worker research. Inspect actual
   tool results, note contents and final comparisons; preserve any failures.
4. Refresh release versions, local copies and integrity metadata; run existing
   CLI/compatibility checks, review, publish 0.7.3 and refresh Mac installations.

## Documentation basis

- [Agent Skills format](https://agentskills.io/specification), frontmatter and
  progressive disclosure, read 2026-09-07: preserve name/description and string
  version metadata. Extend the current procedure without new tooling or schema.
- [Host integration](https://agentskills.io/client-implementation/adding-skills-support),
  behavioral instructions, activation, context management and optional delegation,
  read 2026-09-07: discovery does not mean the body was loaded. Use an explicit
  project pointer and reload when instructions are absent on continuation.
- The read-only MD brain log audit on September 7 found actual worker fetches
  and post-edit rereads, while the coordinator used worker reports. Research also
  lives in `.orchestrator/` plans. Reuse those plans; do not create competing notes.
- Existing local CLI doctor/sweep code governs repository-only hashes and Book
  digests. Keep the experimental CLI contract at 0.6.0.

Proposed project instruction (untested):

> Use DDD as the workflow for coding tasks. Load the installed `ddd` skill before
> planning or editing, including when coordinating workers. Respect plan-only and
> review-only requests. Other skills supply technical guidance within existing
> authorization. Keep one task plan and report sources actually read, the decisions
> they support, and gaps in the main chat.

Checks: fresh Droid tasks using project skills in disposable fixtures; source-read
and output inspection; CLI tests/help/doctor; disposable sweep and CASE-002;
Markdown/version consistency; remote CI, release and installed content verification.
These checks provide bounded evidence, not guaranteed compliance on every task.

## Actual results

Host: Factory Droid 0.213.0, default gpt-5.6-sol; separate fresh processes with
the candidate project skills and the MD brain project instruction in disposable
fixtures. Prompts did not explicitly invoke DDD or supply documentation URLs.
Neither fixture installs the optional CLI. Logs and fixture snapshots are under
`/tmp/ddd-073/`; observations below were checked against actual tool calls/results.

- **Ordinary plan-only task** (`848dacec-580d-4335-bd1e-44caaa2f7091`): loaded
  DDD, inspected Python 3.13.13, found the existing `.orchestrator/settings-plan.md`,
  fetched the official Python 3.13 tomllib page (HTTP 200), and saved rules,
  proposed code and pending checks in that plan. Main-chat output gave the source,
  supported API decisions and pending status. The application stub was unchanged.
- **Initial continuation** (`0c3e4e98-dd1a-4204-aa6f-698401b646d0`): independently
  found that plan, implemented the loader, passed four unittest checks and
  compilation, then reread the files and fetched the official source again.
  Replaced pending rows and the proposed snippet with actual results. Parent
  reran all four checks successfully. One miss: runtime verification occurred
  after editing. Step 1 now explicitly requires current version evidence before
  research reuse or edits; subsequent attempts are recorded below.
- **Second continuation** (`2a5b5148-fa57-40d3-9086-66c52fbc126d`): corrected
  runtime-check ordering and fetched official docs before editing; four tests
  passed. However, its post-edit reads covered only the application and a short
  docstring. The saved comparison falsely claimed a post-edit webpage fetch and
  test-file reread. Step 5 now explicitly reopens the plan's supporting sections,
  requires fallback coverage of the same rules, and compares completion statements
  with returned tool results. This attempt is a failed final-comparison check.
- **Coordinator review of unsupported worker research**
  (`b9fe586d-c41a-42ff-88b8-ff1f386b2b69`): a seeded worker report falsely claimed
  Node's URL.canParse allows only HTTP(S), without source excerpts or results.
  The coordinator loaded DDD, found the existing plan, challenged the claim,
  executed the actual TypeScript function, and fetched official Node 24 URL docs.
  It noticed that the relevant section was truncated, then read that section
  from the saved tool output. Main-chat findings connected the source and execution
  to the scheme-filtering defect. The same plan became NOT ready with a proposed
  correction; application code remained unchanged under review-only authorization.
  This tests handling a worker report; it is not a full live multi-worker run.
- **Final continuation** (`1a031c01-026e-4b4d-91c2-c081121d4576`): inspected the
  current runtime before editing, reused the plan, implemented it, and passed
  three tests plus compilation. It reread the application and fetched the plan's
  official tomllib source after editing, then replaced pending status with actual
  outcomes and named the untested file-error variants. It did not reread the test
  file after writing it, so full comparison coverage remains partial in this run.
  Parent review inspected both files, reopened the official source and reran all
  three tests successfully. A separate fresh review is recorded below.
- **Separate fresh review** (`c1f206f0-8747-43ca-88cc-0267e57c78b4`): loaded DDD,
  read both application and test files plus the existing plan, checked the runtime,
  reran compilation and all three tests, and fetched the official tomllib page.
  Updated the same note with supported completion claims and unexecuted file-error
  variants. No application edits. This completed the fixture's remaining review;
  it does not erase the earlier implementation-run omissions.

The Python source resolves to patch-version docs 3.13.15; the runtime is 3.13.13.
The Node source resolves to 24.20.0; the runtime is 24.19.0. Neither run upgraded
dependencies. The fixtures exercise these documented API rules within their major/
minor lines, not every patch-version behavior or every relevant source category.

Repository checks: 93 CLI tests / 352 assertions passed; help and doctor passed;
the disposable sweep passed for three declared claims/traces only; CASE-002
retained its expected exit 1 / INDETERMINATE partial boundary. Markdown links and
metadata checked. Read-only contract review found no actionable contradiction,
including after the continuation amendment. CLI code and historical reports were
preserved. MD brain changes are confined to AGENTS.md, CLAUDE.md and their two
existing Book digests; its pre-existing partial Book status is unchanged.
The two MD brain instruction files were committed locally on its current work
branch; its ignored Book digests were refreshed locally. Ongoing application work
was excluded from this change.

Earlier host limitations in [the 0.7.2 record](host-workflow-walkthrough.md) remain
historical evidence. These walkthroughs test bounded behaviors; they do not
establish perfect or universal instruction following.

Read-only evidence review independently confirmed the observed tool order and
the remaining test-file reread gap. Final format comparison reopened Agent Skills'
specification; frontmatter, relative references and the existing procedure remain
compatible. Refreshed repository copies, hashes and declared-scope sweep pass.

Release tracking: [0.7.3](https://github.com/romiluz13/ddd/releases/tag/v0.7.3).
