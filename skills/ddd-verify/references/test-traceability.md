# Test-code traceability

Tests are L3 validations but are also code. They must be classified and traced.

## Classification

| Test type | Traces to | Tier | Requirement |
|---|---|---|---|
| Unit test for a traced claim | The claim it validates | T0 | Covered by the claim |
| Integration test for behavioral claim | The behavioral claim | T2 | MUST trace to the behavioral claim |
| Contract test for API claim | The API claim | T1 | MUST trace to the API claim |
| Security test for operational claim | The operational claim | T3 | MUST trace to the operational claim |
| Test that validates no claim | — | — | **Reverse-sweep violation** |

## Good vs bad test tracing

**Good**:
```
Claim CL-002: "cache: 'no-store' disables caching for fetch calls"
Test: "should not cache when cache: 'no-store' is set"
Trace: TR-015 links CL-002 to test file
```

**Bad**:
```
Claim CL-002: "cache: 'no-store' disables caching for fetch calls"
Test: "should fetch data correctly" (no assertion about caching)
No trace entry
→ Reverse-sweep violation: test validates no claim
```
