# Stack Detection Procedure (SPEC.md §9.8)

## Manifest files to scan

| File | Language/Ecosystem |
|---|---|
| `package.json` | JavaScript/TypeScript |
| `pyproject.toml` | Python |
| `Cargo.toml` | Rust |
| `go.mod` | Go |
| `pom.xml` | Java (Maven) |
| `build.gradle` | Java (Gradle) |
| `composer.json` | PHP |
| `Gemfile` | Ruby |
| `mix.exs` | Elixir |
| `deno.json` | Deno |

## Lockfiles for installed versions

| File | Ecosystem |
|---|---|
| `package-lock.json` | npm |
| `yarn.lock` | Yarn |
| `pnpm-lock.yaml` | pnpm |
| `poetry.lock` | Python (Poetry) |
| `Cargo.lock` | Rust |
| `go.sum` | Go |
| `Gemfile.lock` | Ruby |

## Config files

| File | What it tells you |
|---|---|
| `tsconfig.json` | TypeScript project |
| `next.config.*` | Next.js framework |
| `vite.config.*` | Vite bundler |
| `Dockerfile` | Containerized deployment |
| `docker-compose.yml` | Multi-service architecture |
| `.env.example` | Environment variables (reveals services) |
| `wrangler.toml` | Cloudflare Workers |
| `vercel.json` | Vercel deployment |

## Framework detection

| Signal | Framework |
|---|---|
| `next` in dependencies + `next.config.*` | Next.js |
| `react` in dependencies + `vite.config.*` | React + Vite |
| `@angular/core` in dependencies | Angular |
| `vue` in dependencies | Vue |
| `express` in dependencies | Express |
| `fastify` in dependencies | Fastify |
| `@nestjs/core` in dependencies | NestJS |
| `hono` in dependencies | Hono |
| `django` in dependencies | Django |
| `fastapi` in dependencies | FastAPI |
| `flask` in dependencies | Flask |
| `actix-web` in dependencies | Actix Web |
| `axum` in dependencies | Axum |
| `gin` in dependencies | Gin |

## Database detection

| Signal | Database |
|---|---|
| `prisma` in dependencies + `schema.prisma` | Prisma ORM (check datasource) |
| `drizzle-orm` in dependencies | Drizzle ORM |
| `mongoose` in dependencies | MongoDB |
| `pg` / `postgres` in dependencies | PostgreSQL |
| `mysql2` in dependencies | MySQL |
| `redis` / `ioredis` in dependencies | Redis |
| `elasticsearch` in dependencies | Elasticsearch |
| `mongodb` connection string in config | MongoDB |
| `DATABASE_URL` in `.env.example` | Check protocol (postgres://, mongodb://, etc.) |

## Architecture inference

| Signal | Architecture |
|---|---|
| `apps/` + `packages/` directories | Monorepo |
| `src/server/` + `src/client/` | Full-stack app |
| `src/components/` + `src/pages/` or `src/app/` | Frontend app |
| `src/routes/` or `src/controllers/` | Backend API |
| `workers/` directory | Worker/background jobs |
| `services/` directory with multiple subdirs | Microservices |
| Docker Compose with multiple services | Multi-service |

## Fallback ladder for obscure dependencies

1. Check package registry for the package name
2. Check project's own `node_modules/` or equivalent for bundled docs
3. Search for the package source repository
4. Check if private/internal package — follow authenticated doc acquisition
5. Record exception (type: `unknown`) — dependency MUST NOT be used without evidence or waiver
