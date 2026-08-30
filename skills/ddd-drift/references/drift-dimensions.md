# Drift Dimensions (SPEC.md §20.5)

## Dimension 1: Evidence drift

Entry becomes stale when:
- Content digest no longer matches (source changed)
- Freshness policy expired
- Source superseded by newer version
- Source URL returns 404 or redirect

**Check**: Re-fetch each evidence lock entry, compare digest.
**Route to**: `ddd-scope` (re-acquire and re-lock)

## Dimension 2: Documentation drift

Documentation drifts from code when:
- Code behavior changed but ADRs/CONTEXT.md/Book references not updated
- API signatures in code no longer match documented signatures
- Domain model in `.ddd/models/` no longer matches implemented domain logic

**Check**: Compare current code structure against Book references and passports.
**Route to**: `ddd-book` (update references)

## Dimension 3: Decision drift

- ADR marked "accepted" but implementation diverges from selected alternative
- Rejected alternatives silently adopted
- Decision constraints violated by later changes

**Check**: Compare ADR decisions against current implementation and obligation status.
**Route to**: `ddd-decide` (re-evaluate if needed)

## Dimension 4: Control drift

- Compiled control no longer catches violations it was validated for
- Adapter updated, control behavior changed
- Obligation exists but no control compiled
- Control exists but obligation superseded

**Check**: Re-run control validation fixtures. Check obligation-control mapping.
**Route to**: `ddd-controls` (recompile)

## Dimension 5: Code drift

- Grandfathered code modified without entering DDD scope
- Construct's traced claims no longer match implementation
- New constructs without passports (if responsibility-bearing)
- Reverse sweep violations accumulated since last check

**Check**: Run reverse sweep on changed code. Check passport coverage.
**Route to**: `ddd-ground` (trace new constructs) or `ddd-exception` (if gaps found)

## Dimension 6: Project context drift

- New dependency added but `project-context.yaml` not updated
- Dependency version upgraded but recorded version stale
- Framework added/removed but context doesn't reflect it

**Check**: Re-run stack detection, compare against `project-context.yaml`.
**Route to**: `ddd-book` (update project context)

## Dimension 7: Cache drift

- Cache files not content-addressed (named by slug instead of hash)
- Cache entries missing (evicted but still referenced by evidence lock)
- Cache content doesn't match evidence lock digest (corruption)

**Check**: Verify cache file naming, check all evidence lock entries have cache files, verify digest consistency.
**Route to**: `ddd-scope` (re-acquire missing cache entries)

## Severity guidance

| Severity | Meaning |
|---|---|
| `critical` | Evidence underlying a T3 claim has drifted — claims may be unfounded |
| `high` | Evidence for T2 claims drifted, or documentation significantly mismatches code |
| `medium` | Freshness expired, minor doc mismatch, uncompiled obligation |
| `low` | Cosmetic drift, grandfathered code minor change |

## Lifecycle re-entry

| Drift type | Transition | Precondition |
|---|---|---|
| Evidence drift (contradictory) | Any active change → `UNSCOPED` | Evidence lock entry invalidated, new content contradicts existing claims |
| Evidence drift (version refresh) | Any active change → `EVIDENCE_LOCKED` | Evidence lock entry invalidated, new content is consistent |
| Documentation drift | Route to `ddd-book` | No lifecycle state change |
| Decision drift | Route to `ddd-decide` | Change returns to `UNSCOPED` if decision revised |
| Control drift | Route to `ddd-controls` | No lifecycle state change |
| Code drift | Route to `ddd-ground` | Change enters `IMPLEMENTING` → `VERIFYING` cycle |

Only changes depending on the invalidated evidence lock entry are affected. Unrelated changes are not disrupted.
