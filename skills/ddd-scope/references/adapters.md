# External source retrieval adapters

## Adapter table

| Adapter | Use | Output |
|---|---|---|
| Context7 | `resolve-library-id` + `query-docs` for library docs | Markdown sections |
| Web search + fetch | General documentation | HTML → Markdown, content hashed |
| Local files | Project docs, ADRs, domain models | File content with path |
| `llms.txt` | Sources that publish llms.txt | Markdown |
| Official source code | Types, schemas, test suites | Source files |
| Package registries | npm, PyPI, crates.io | Metadata JSON, peer deps |
| OpenAPI / GraphQL | API contract schemas | Schema YAML/JSON |
| DB schema files | Prisma, Drizzle, SQL migrations | Schema definitions |
| Language core docs | MDN, Python docs, Rust std docs, Go docs | Reference pages |
| Authenticated docs | Internal wikis, Confluence | Content with access-control provenance |

## Cache policy

- Cache files are **content-addressed**: named by `sha256` prefix of content (first 16 hex chars)
- Location: `.ddd/cache/`
- Cache files SHOULD be gitignored (they're rebuildable)
- Eviction: LRU with configurable max size (default: 100 MB)
- Retention: entries are kept as long as their evidence lock entry is active
- When an evidence lock entry is revoked, its cache file MAY be evicted

## Access-control provenance (authenticated docs)

When acquiring docs from authenticated sources:
- Record `access_method` (e.g., "API token", "session cookie", "OAuth")
- Do NOT record credentials, tokens, or cookies in evidence lock entries
- Record the identity of the accessor (e.g., "agent-service-account")
- Note: `access_control: authenticated` in the evidence lock entry
