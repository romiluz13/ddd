# DDD fresh-context walkthroughs: rival-explanations clause (v0.7.6)

Run date: 2026-09-11. Purpose: recorded fresh-context walkthrough of the §4
methodology change "When rival explanations would lead to different fixes, name
what would distinguish them and obtain it before choosing; if it is unavailable,
record the open question, leave the dependent work visibly blocked, and continue
independent work."

Three separate worker agents with no parent conversation history received a
pointer to `skills/ddd/SKILL.md` (main at commit c32049d, the clause already
committed) and an ordinary task file. The parent prepared disposable projects,
verified the fixture failure modes before dispatch, and reran every completed
check after the agents finished. No evaluation platform was built; these
observations cover the listed tasks only.

The temporary root was `/tmp/ddd-walkthroughs-pstack.oygcqs` (may disappear;
the observations are preserved here). All tasks were Python standard-library
only; no external dependencies were installed. No global agent settings were
changed.

## Required scenarios

| Scenario | Fixture | Observed behavior | Note written by agent |
|---|---|---|---|
| a. Rival explanations, discriminating evidence available | s1-discriminate: second unittest fails while an identical first passes | Agent named the rival explanations (double-applied discount vs. float rounding) and obtained a runtime probe (call `set_discount` twice, inspect the accumulated list: 2.7 then 2.43, two identical entries) BEFORE choosing replace-semantics over append. Probe recorded as ruling out rounding and confirming accumulation. | `failing-check-store-discount.md` |
| b. Rival explanations, evidence unavailable | s2-unavailable: `load_config` per a spec at an unresolvable `.invalid` URL, plus an independent `validate_port` deliverable | Agent attempted FetchUrl (503), curl (exit 6, RFC 2606 TLD), and two web searches; no format semantics invented; stub left raising `NotImplementedError` (re-executed to confirm); open question recorded with its exact unblock condition; independent deliverable implemented and tested 7/7; bool-subtype ambiguity grounded in official docs and recorded as a one-word user ruling away. | `acme-config-and-port-validator.md` |
| c. Correction valid under either explanation | s3-same-fix: finished code contradicts its own docstring contract (missing `% 24`) | Rival explanations for why the check fails do not change the fix (apply the docstring formula); agent proceeded directly from the module's shipped contract, saved the failing output before the fix, and verified the corrected body against the docstring by reread. No discriminator demanded. | `clock-wrap-hours.md` |

## Fixture details

**s1 (discriminator available):** `store.py` kept discounts in an append-only
module list; `cart_total` applied every matching entry multiplicatively.
`test_first_discount` passed and `test_second_discount` failed (2.43 vs 2.7)
under unittest's single-import, sorted-order execution. Fixes genuinely differed
by explanation (replace-semantics in product code vs. wrong expectation in the
test); the discriminating probe (isolated accumulation trace) selected the
product-code fix. Tests untouched. Agent also recorded the uncovered
case (differing percentages on one item) as an open question rather than
silently choosing.

**s2 (evidence unavailable):** the authoritative spec for the fictional Acme
Config v3 format was deliberately unresolvable. Dependent work stayed visibly
blocked (stub verified unedited by execution); independent work proceeded.
The review gate was recorded as waived (no independent reviewer exists in a
single-worker walkthrough), not as clean.

**s3 (same fix under either explanation):** the docstring pinned the contract
`hour = (total_minutes // 60) % 24`; the body omitted the modulo. Baseline: one
passing test, one failing (1500 minutes → (25, 0) vs (1, 0)). One-line
correction; suite green; boundary and negative-input probes recorded. The
clause's condition ("would lead to different fixes") was not met, and the agent
correctly did not stall on distinguishing evidence.

## Parent verification

Rerun after completion, from each temporary project directory:

| Project | Command | Result |
|---|---|---|
| s1-discriminate | `python3 -m unittest discover -s . -p "test_*.py"` | Ran 2 tests, OK |
| s2-unavailable | `python3 -m unittest discover -s . -p "test_*.py"` | Ran 7 tests, OK |
| s2-unavailable | `python3 -c` calling `load_config('x')` | NotImplementedError (stub intact) |
| s3-same-fix | `python3 -m unittest discover -s . -p "test_*.py"` | Ran 2 tests, OK |

## Limits

Synthetic local tasks, not production assurance or a cross-host reliability
measurement. Walkthrough agents were one worker type on one host; the scenarios
exercise the changed sentence's three branches, not the whole methodology. The
expected blocked deliverable (s2 `load_config`) is not counted as implemented.
