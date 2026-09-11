# DDD walkthrough: TypeScript account validation

Date: 2026-09-05. Working directory: `/tmp/ddd-walkthroughs.SIARed/typescript`
(macOS resolves this to `/private/tmp/ddd-walkthroughs.SIARed/typescript`).

## Task and boundaries

Read `~/Dev/DDD/skills/ddd/SKILL.md`, then `TASK.md`.
Implemented the requested `parseAccount`: valid email, numeric age-string
coercion, minimum age 18, invalid-input rejection, and unknown-field stripping.
Only this temporary project was edited. No DDD CLI, Book, dependencies, or
other tooling were installed. No assurance report or Book was fabricated.

## Observed discovery actions

1. Read `account.ts`, `account.test.ts`, `package.json`, `package-lock.json`,
   and the installed `node_modules/zod/package.json` and `index.js`.
   The original implementation returned its input unchanged.
2. `bun --version` returned `1.3.13`.
3. Ran:

   ```sh
   bun -e 'import { createRequire } from "node:module"; const require = createRequire(import.meta.url); console.log(require.resolve("zod")); console.log(require("zod/package.json").version);'
   ```

   Output: `/private/tmp/ddd-walkthroughs.SIARed/typescript/node_modules/zod/index.cjs`
   and `3.25.76`. Manifest pins exactly `3.25.76`; lockfile and installed
   package agree. The root ESM export imports `./v3/external.js`.
4. Web search query: `site.v3.zod.dev coerce number object strip email parse`.
   Search returned current v4 pages, the official v3 GitHub documentation,
   and v3 hosted pages. Third-party results were not used as authority.
5. Opened `https://v3.zod.dev/?id=coercion-for-primitives`,
   `https://v3.zod.dev/?id=objects`, and `https://v3.zod.dev/?id=parse`.
   All returned titles but zero readable body lines through the browser tool.
6. Tried the version-tagged official URL
   `https://raw.githubusercontent.com/colinhacks/zod/v3.25.76/packages/docs-v3/home.md`.
   It returned HTTP 404. This was a failed source attempt, not version proof.
7. Opened the official repository's
   [v3 documentation source](https://github.com/colinhacks/zod/blob/main/packages/docs-v3/home.md).
   Used browser find/open for coercion, finite numbers, object stripping,
   unions, and parsing. An attempted find for an older pipe/coercion heading
   produced broad surrounding text; it did not establish that heading existed.
8. Read the raw official v3 source with this successful command (exit 0):

   ```sh
   curl -fsSL https://raw.githubusercontent.com/colinhacks/zod/main/packages/docs-v3/home.md | awk '/^## Basic usage/{p=1} /^## Primitives/{p=0} /^## Coercion for primitives/{p=1} /^## Literals/{p=0} /^## Strings/{p=1} /^### Datetimes/{p=0} /^## Numbers/{p=1} /^## BigInts/{p=0} /^### `.pipe`/{p=1} /^## Guides/{p=0} p'
   ```

   This read actual relevant sections, including imports, string validation,
   number conversion, minimum/finite constraints, and pipeline semantics.
   The `main` branch is mutable and is not an exact-version reference.
9. Resolved version applicability using the shipped Zod 3.25.76
   implementation and declarations: `node_modules/zod/index.js`,
   `node_modules/zod/v3/types.js`, and `node_modules/zod/v3/types.d.ts`.
   Used `rg` to locate methods, then `sed` to read their implementations.
   This provided exact installed-version support when tagged hosted docs failed.

The task was self-contained; workspace memory was not used. General
`find-skills` and `brainstorming` skill files were read while checking inherited
guidance. No skill search or installation was run: Zod is covered by the
global stable-utility exception. The explicit implementation request supplied
authorization to continue after presenting the grounded design. The
verification-before-completion skill was read and used for final evidence.

## Grounded plan presented before editing

Assumption: age accepts finite numbers or strings converted with JavaScript
number semantics. Other types are invalid, even if JavaScript could coerce
them. Fractional ages are allowed because the task requires a minimum, not
an integer. Email validity uses the installed library's email validator.

- Import `z` from `zod` and build one module-level object schema; return its
  `.parse(input)` result. Sources: [Basic usage](https://github.com/colinhacks/zod/blob/main/packages/docs-v3/home.md#basic-usage)
  and [parse](https://github.com/colinhacks/zod/blob/main/packages/docs-v3/home.md#parse).
- Validate email with `z.string().email()`; use the library's existing email
  behavior. Source: [Strings](https://github.com/colinhacks/zod/blob/main/packages/docs-v3/home.md#strings).
- Restrict age to numbers or strings, then coerce and enforce finite value
  and inclusive minimum 18. Sources: [Unions](https://github.com/colinhacks/zod/blob/main/packages/docs-v3/home.md#unions),
  [pipe](https://github.com/colinhacks/zod/blob/main/packages/docs-v3/home.md#pipe),
  [Coercion](https://github.com/colinhacks/zod/blob/main/packages/docs-v3/home.md#coercion-for-primitives),
  and [Numbers](https://github.com/colinhacks/zod/blob/main/packages/docs-v3/home.md#numbers).
- Retain default object stripping, established by
  [strip](https://github.com/colinhacks/zod/blob/main/packages/docs-v3/home.md#strip)
  and the shipped object implementation.
- Run the native `bun test` script; add minimum-boundary and malformed-input
  checks using the project's existing `bun:test` conventions.

**Adapted snippet, proposed and untested when the plan was presented:**

```ts
import { z } from "zod";

const accountSchema = z.object({
  email: z.string().email(),
  age: z.number().or(z.string()).pipe(z.coerce.number().finite().min(18)),
});

export function parseAccount(input: unknown) {
  return accountSchema.parse(input);
}
```

Adaptations: account-specific fields and minimum, a number/string input guard
before coercion, and a finite-age constraint. This is composed application
code, not a copied official example. Parsing is synchronous and lets validation
errors propagate to the caller. No asynchronous resources or cleanup arise.

## Edits

- `account.ts`: added the import/schema above; replaced `return input` with
  `return accountSchema.parse(input)`.
- `account.test.ts`: preserved the original two tests; added tests for age
  `18` and `"18"`, invalid outer shapes, missing fields, underage strings,
  malformed strings, empty strings, null/boolean/array/object ages, infinity,
  and NaN.
- `WALKTHROUGH.md`: this requested execution record.
- `package.json`, `package-lock.json`, and installed packages were not edited.

## Documentation basis and final comparison

Technology: Zod 3.25.76 root v3 API. Runtime: Bun 1.3.13. No service API,
frontend, network call, lifecycle resource, or additional dependency was added.
The official sections above support the plan; exact-version evidence comes
from the shipped files below. Open documentation questions: none for the APIs
used. Comparison/check status was pending at planning time and is now recorded.

After editing, reread all of `account.ts` and `account.test.ts` and reopened
the relevant shipped official source sections with `cat`, `rg`, and `sed`:

| Actual changed API | Reopened exact installed source | Comparison |
| --- | --- | --- |
| `import { z } from "zod"` | `index.js` lines 1–4 | Named root export delegates to v3. |
| `.parse(input)` | `v3/types.js` lines 105–117 | Returns parsed data on success; throws validation error otherwise. |
| `.or(z.string())` | `v3/types.js` lines 299–308 | Constructs union of the two schemas. |
| `.pipe(...)` | `v3/types.js` lines 348–352 and 3468–3525 | Parses input schema first, then output schema if valid. |
| `.email()` | `v3/types.js` lines 549–555 and 815–825 | Installs and executes email validation. |
| `z.coerce.number()` | `v3/types.js` lines 1063–1085 and 3682–3686 | Coercion enables `Number(input.data)` before number validation. |
| `.min(18)` | `v3/types.js` lines 1063–1115 and 1156–1160 | `min` aliases inclusive `gte`; rejects ages below 18. |
| `.finite()` | `v3/types.js` lines 1135–1155 and 1230–1242 | Adds finite check; rejects non-finite values. |
| `z.object({...})` stripping | `v3/types.js` lines 1930–1986 and 2239–2249 | Requires object input and defaults unknown keys to strip. |

The code matched these API contracts. No corrections were needed after final
comparison. The tests exercise the public function rather than schema internals.
There is no git baseline in this temporary fixture; the actual replacement
was compared against the initial file reads and the applied patch.

## Commands and actual results

Before implementation:

```text
$ bun test
bun test v1.3.13 (bf2e2cec)
0 pass
2 fail
2 expect() calls
Ran 2 tests across 1 file. [21.00ms]
exit=1
```

The first failure showed unchanged `"21"` plus the extra `ignored` field.
The second failure showed that an invalid email did not throw.

Immediately after implementation: `bun run test` invoked `bun test` and
returned 4 pass, 0 fail, 21 assertions, 105 ms, exit 0.

Final verification, after the code-to-source comparison:

```text
$ bun run test
$ bun test
bun test v1.3.13 (bf2e2cec)
account.test.ts:
(pass) parses an account and drops unknown fields [6.84ms]
(pass) rejects an invalid email and underage account [1.39ms]
(pass) accepts the minimum age as a number or numeric string [0.13ms]
(pass) rejects malformed accounts and ages [0.71ms]
4 pass
0 fail
21 expect() calls
Ran 4 tests across 1 file. [122.00ms]
exit=0
```

## Limitations

No TypeScript compiler, lint, or build script is declared by this fixture;
none was installed or claimed to pass. Bun execution verifies transpilation
and runtime behavior, not static TypeScript checking. Hosted v3 pages could
not be read by the browser tool, and the attempted release-tag documentation
URL returned 404; official mutable v3 docs plus installed package source were
the fallback. The checks cover this function and the listed cases, not all
possible email addresses or numeric strings. Email syntax validation does not
establish mailbox existence. No repository-wide conformance claim is made.
