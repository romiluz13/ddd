# Citation Entailment Verification (SPEC.md §13.4)

## The 5-step procedure

### Step 1: Locate the cited section

Open the evidence lock entry and navigate to the specific `sections` referenced by the claim's `ref` field. If the section cannot be located, the citation fails.

### Step 2: Read the source content

Read the actual cached content at the cited section. Do NOT rely on the claim author's summary.

### Step 3: Classify the entailment

| Classification | Meaning | Action |
|---|---|---|
| `explicit` | Source directly states the claim | Pass |
| `implicit` | Source says A and B, claim follows logically | Pass (rationale MUST explain derivation) |
| `paraphrase` | Claim is a semantically equivalent restatement | Pass |
| `not-entailed` | Source does not address the claim | **Conformance failure** |
| `contradicts` | Source states the opposite | **Conformance failure** |

### Step 4: Record results

Each claim-source pair records the entailment classification with verifier notes.

### Step 5: Prioritize by tier

| Tier | Verification depth |
|---|---|
| T3 | Every citation MUST be verified |
| T2 | Every citation MUST be verified |
| T1 | Sample verification (at least 30% of citations) |
| T0 | No individual citation required |

## Good vs bad entailment

**Good** (explicit):
- Claim: "Next.js extends fetch with caching options"
- Source: "Next.js extends the native fetch API with additional caching options" 
- Result: `explicit` — pass

**Good** (implicit):
- Claim: "bcrypt is not available in Edge Runtime"
- Source says: "Edge Runtime supports a subset of Node.js APIs" and separately "bcrypt requires Node.js native modules"
- Result: `implicit` — pass, rationale explains the derivation

**Bad** (not-entailed):
- Claim: "Prisma supports MongoDB transactions"
- Source: "Prisma supports PostgreSQL transactions" (different database)
- Result: `not-entailed` — conformance failure

**Bad** (contradicts):
- Claim: "zod 3.23 supports record inference"
- Source: "Record inference was added in zod 3.24"
- Result: `contradicts` — conformance failure
