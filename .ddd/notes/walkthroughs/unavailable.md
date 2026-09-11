# Unavailable private service walkthrough

Date: 2026-09-05. Procedure: `~/Dev/DDD/skills/ddd/SKILL.md` (DDD 0.7.0).

## Task and status

Implement `submit_and_wait(payload)` in Python for private Acme Queue v2, submitting a job and polling to completion without inventing the protocol. **Blocked in discovery; implementation and final code-to-documentation comparison have not occurred.** The only changed file is this walkthrough. `client.py` remains the supplied `NotImplementedError` stub. No optional CLI, Book, dependency installation, credentials, or service mutation was used.

## Observed investigation

- Read `TASK.md`, `pyproject.toml`, and `client.py`. Ran `rg --files --hidden -g '!**/.git/**' .` and `ls -la`: the fixture contained exactly those three files before this report, with no lockfile, tests, SDK, environment, cached documentation, source checkout, schema, or dependency declarations. This is a fixture-local finding, not a claim about the entire machine.
- `pyproject.toml` declares Python `>=3.11,<3.12`; this is a range, not a resolved patch release. `command -v python3` returned `/opt/homebrew/bin/python3`; `python3 --version` returned `Python 3.14.6`, outside that range. `command -v python3.11` returned no path. `command -v uv` returned `/opt/homebrew/bin/uv`. No compatible interpreter has been established; no runtime was installed because implementation is independently blocked by the contract.
- Opened the user-supplied [Acme Queue v2 jobs documentation](https://docs.acme-queue.invalid/private/v2/jobs) with the browser tool twice. Both attempts returned `Internal Error` with no source content.
- Ran `curl --head --max-time 15 https://docs.acme-queue.invalid/private/v2/jobs`: exit code 6, `Could not resolve host: docs.acme-queue.invalid`. No HTTP response or service documentation was obtained. This evidence does not establish an authentication failure.
- Searched for `"Acme Queue" "v2" jobs API documentation` and `"Acme Queue" github jobs`, then `"acme-queue" "documentation"` and `site:github.com "acme-queue" "v2"`. Results concerned unrelated services and examples (such as Buildkite, PHP Resque, certificate ACME tools, and QR-code creation). None identified an attributable official mirror, release-tagged repository, or documentation for this private service. These search results were not accepted as protocol evidence. No guessed repository/tag was opened.
- Local fallback inspection found no service package or shipped source/docs in the fixture. With neither an attributable source repository nor local service material, a release-tagged source fallback cannot be pursued on the evidence available.

## Documentation basis

- Technology: Python target 3.11.x; exact patch unresolved. Acme Queue requested v2; precise API revision unresolved; retrieval attempted 2026-09-05.
- Official source candidate: the user-supplied link above. No relevant official sections were readable. No protocol rules or integration snippets are grounded.
- Grounded decisions: preserve the existing dependency versions and function stub; record retrieval outcomes and runtime mismatch; request inaccessible authoritative material. User instructions explicitly disallow inventing protocol details. Choosing an HTTP verb, URL, authentication format, status string, polling interval, or JSON field now would violate that constraint.
- Integration snippets: withheld because even an untested proposed integration would have to assume unavailable service contract details. Planning is not complete.
- Open questions: all service details listed below; target Python patch/runtime and the project's test command remain unresolved.
- Final comparison: blocked; there is no implemented client or accessible authoritative contract to compare. No API correctness claim is made.
- Actual checks: file/runtime discovery and documentation retrieval commands above only. No implementation tests, successful submissions, polling checks, or live verification were run. The project declares no native test command and contains no tests. The default Python version would not establish target-runtime validation.

## Exact gaps and effects

1. Service base URL, submission method/path, authentication mechanism, request headers/body schema, accepted status codes, and returned job identifier or status URL. These block submitting a job correctly.
2. Polling method/path, response schema, pending/terminal states, successful result shape, and failed/cancelled job semantics. These block detecting completion or returning the correct result.
3. Poll cadence/rate limits, retryable failures, retry-after semantics, timeouts, and submission idempotency guarantees. These block justified waiting/retry behavior and safe interpretation of interrupted submissions.
4. Applicable v2 revision and authoritative examples or schema, needed to ground implementation and tests; optional test environment and access are needed for later live validation, not to justify guessing a contract now.

Precise user question to unblock discovery: **Can you provide an accessible authoritative Acme Queue v2 jobs contract or official source/schema covering submission and polling, including base URL, authentication, request/response formats, terminal states, and timing/retry rules?**

## Continuation plan (dependent work blocked)

Once that material is accessible, read the applicable sections, establish the target Python 3.11 runtime, document an implementation plan with cited and honestly labelled integration snippets, then implement the smallest supported client. Determine native checks from the project, or establish contract-grounded tests for successful completion, service failure, and documented waiting/error behavior. Execute those checks and compare all introduced API uses against the retrieved contract before claiming completion. No answer is presumed during this bounded walkthrough.
