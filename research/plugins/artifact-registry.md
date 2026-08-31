# Internal Artifact Registry (SPEC.md §9.12)

The full catalog of internal artifact classes DDD recognizes, with per-language detection patterns. The spec (§9.12.1) defines 15 groups; this file expands each group into its individual classes with detection rules.

## How to use this file

1. After stack detection, identify which language(s) and ecosystem(s) the project uses
2. For each ecosystem, scan the detection patterns listed below
3. For each match, classify the artifact and lock it as evidence per §9.12.2
4. Only run patterns for the detected ecosystem — a Python project skips all JS/TS patterns

## Detection pattern types

- **import**: scan source files for `import ... from 'package'` or `from package import` or `use package`
- **glob**: match file paths by pattern (e.g., `*.prisma`, `*.tf`, `*.proto`)
- **decorator**: scan for decorator/attribute usage (e.g., `@dataclass`, `@Entity`, `@serializable`)
- **convention**: scan for naming conventions or directory structure
- **config-key**: scan config files for specific keys

---

## 1. Data & persistence

### `orm-model`
ORM/entity definitions mapping code objects to database tables.

| Ecosystem | Detection | Examples |
|---|---|---|
| JS/TS | import: `prisma`, `drizzle-orm`, `sequelize`, `typeorm`, `mongoose`, `knex` | `model User { ... }` (Prisma), `pgTable('users', ...)` (Drizzle), `class User extends Model` (Sequelize) |
| Python | import: `sqlalchemy`, `django.db.models`, `peewee`, `tortoise`, `SQLModel` | `class User(Base):` (SQLAlchemy), `class User(models.Model):` (Django) |
| Rust | import: `diesel`, `sea-orm`, `sqlx` (with macros) | `#[derive(Identifiable)] struct User` (Diesel) |
| Go | import: `gorm`, `ent`, `sqlx` (with struct tags) | `type User struct { gorm.Model }` |
| Java | import: `javax.persistence`, `jakarta.persistence`, `org.hibernate` | `@Entity class User` |
| Ruby | import: `ActiveRecord` (Rails) | `class User < ApplicationRecord` |
| C# | import: `Microsoft.EntityFrameworkCore`, `System.ComponentModel.DataAnnotations` | `public class User` with `[Key]` |
| PHP | import: `Doctrine\ORM`, `Eloquent` (Laravel) | `class User extends Model` |

**Authority for**: data-persistence, domain-rules
**Source class**: code-derived

### `database-migration`
Schema evolution files (up/down, forward/rollback).

| Ecosystem | Detection | Examples |
|---|---|---|
| JS/TS | glob: `migrations/**`, `prisma/migrations/**`, `drizzle/migrations/**`, `supabase/migrations/**` | `001_create_users.sql`, `0001_init.ts` |
| Python | glob: `migrations/**`, `alembic/versions/**` | `001_create_users.py` (Alembic) |
| Rust | glob: `migrations/**` | `0001_create_users.sql` (Refinery, sqlx) |
| Go | glob: `migrations/**`, `db/migrations/**` | `0001_create_users.up.sql` (goose, golang-migrate) |
| Java | glob: `src/main/resources/db/migration/**` | `V001__Create_users.sql` (Flyway) |
| Ruby | glob: `db/migrate/**` | `001_create_users.rb` (Rails) |
| C# | glob: `Migrations/**` | `0001_InitialCreate.cs` (EF Core) |
| PHP | glob: `database/migrations/**`, `migrations/**` | `2024_01_01_create_users.php` (Laravel) |

**Authority for**: data-persistence, compatibility
**Source class**: code-derived

### `schema-definition`
Standalone schema files not embedded in code.

| Ecosystem | Detection | Examples |
|---|---|---|
| Any | glob: `*.prisma` | Prisma schema |
| Any | glob: `*.graphql`, `*.gql` | GraphQL SDL |
| Any | glob: `*.proto` | Protocol Buffers / gRPC |
| Any | glob: `*.sql` (in schema/ddl dirs) | SQL DDL |
| Any | glob: `*.avsc` | Avro schema |
| Any | glob: `*.thrift` | Thrift IDL |

**Authority for**: data-persistence, api-semantics
**Source class**: code-derived

### `seed-data`
Seed files, fixtures, factory definitions.

| Ecosystem | Detection | Examples |
|---|---|---|
| JS/TS | glob: `**/seed*.{ts,js,json}`, `**/fixtures/**`, `**/factories/**` | `seed.ts`, `factories/user.ts` |
| Python | glob: `**/seed*.py`, `**/fixtures/**`, `**/factories.py` | `seed.py`, `conftest.py` fixtures |
| Ruby | glob: `db/seeds*.rb`, `spec/factories/**` | `seeds.rb`, FactoryBot factories |
| Any | glob: `**/seed*.{sql,json,yaml,yml}` | Raw seed data |

**Authority for**: product-behavior, testing
**Source class**: project-doc

---

## 2. Validation

### `validation-schema`
Runtime data validation schemas.

| Ecosystem | Detection | Examples |
|---|---|---|
| JS/TS | import: `zod`, `joi`, `yup`, `valibot`, `@hono/zod-openapi`, `superstruct` | `z.object({ email: z.string().email() })` |
| Python | import: `pydantic`, `marshmallow`, `cerberus`, `colander` | `class UserSchema(BaseModel):` |
| Rust | import: `validator`, `garde` | `#[validate(email)]` |
| Go | import: `go-playground/validator` | `type User struct { Email string \`validate:"email"\` }` |
| Java | import: `javax.validation`, `jakarta.validation`, `hibernate-validator` | `@Email String email` |
| Ruby | import: `dry-validation`, `active_model` (validates) | `schema do required(:email).filled(:string) end` |
| C# | import: `System.ComponentModel.DataAnnotations`, `FluentValidation` | `[EmailAddress] string Email` |
| PHP | import: `symfony/validator`, `respect/validation` | `Validator::email()->validate($email)` |

**Authority for**: data-validation, api-semantics
**Source class**: code-derived

### `form-validation`
Form-level validation rules tied to UI components.

| Ecosystem | Detection | Examples |
|---|---|---|
| JS/TS | import: `react-hook-form`, `formik`, `@conform-to/react`, `vee-validate` (Vue) | `useForm({ resolver: zodResolver(schema) })` |
| Python | import: `django.forms`, `wtforms` | `class UserForm(forms.Form):` |
| Ruby | convention: files matching `*_form.rb` or `Forms::` namespace | `class UserForm` |
| PHP | import: `symfony/form` | `class UserType extends AbstractType` |

**Authority for**: ux, data-validation
**Source class**: code-derived

---

## 3. API contracts

### `api-contract`
External API specification files.

| Ecosystem | Detection | Examples |
|---|---|---|
| Any | glob: `openapi.{json,yaml,yml}`, `swagger.{json,yaml,yml}` | OpenAPI/Swagger |
| Any | glob: `*.graphql`, `schema.graphql` | GraphQL schema |
| Any | glob: `*.proto` | gRPC/Protocol Buffers |
| JS/TS | import: `@trpc/server` | tRPC router definitions |
| Any | glob: `*.avsc`, `*.avro` | Avro schema |
| JS/TS | import: `hono`, `@hono/zod-openapi` | Hono OpenAPI route definitions |

**Authority for**: api-semantics, protocol-behavior
**Source class**: code-derived

### `route-definition`
Internal route/endpoint definitions.

| Ecosystem | Detection | Examples |
|---|---|---|
| JS/TS (Next.js) | convention: `app/api/**/route.{ts,tsx,js}`, `pages/api/**` | `export async function GET(request)` |
| JS/TS (Express/Fastify/Hono) | import: `express`, `fastify`, `hono` + method calls | `app.get('/users', handler)` |
| JS/TS (NestJS) | decorator: `@Controller`, `@Get`, `@Post` | `@Controller('users') class UserController` |
| Python (Django) | glob: `**/urls.py` | `urlpatterns = [path('users/', views.users)]` |
| Python (FastAPI) | import: `fastapi` + decorator: `@app.get`, `@router.get` | `@app.get('/users')` |
| Python (Flask) | import: `flask` + decorator: `@app.route` | `@app.route('/users')` |
| Rust (Axum) | import: `axum` + method: `.route(` | `Router::new().route('/users', get(handler))` |
| Rust (Actix) | import: `actix-web` + attribute: `#[get('/users')]` | `#[get('/users')] async fn users()` |
| Go | import: `net/http`, `gin-gonic/gin`, `gorilla/mux`, `chi` | `r.GET('/users', handler)` (Gin) |
| Java (Spring) | decorator: `@RestController`, `@RequestMapping`, `@GetMapping` | `@GetMapping('/users')` |
| Ruby (Rails) | glob: `config/routes.rb` | `resources :users` |
| PHP (Laravel) | glob: `routes/web.php`, `routes/api.php` | `Route::get('/users', ...)` |

**Authority for**: api-semantics, product-behavior
**Source class**: code-derived

### `serializer`
Serialization/deserialization contracts.

| Ecosystem | Detection | Examples |
|---|---|---|
| JS/TS | import: `superjson`, `devalue`, `flatted` | Custom serializer classes |
| Python | import: `marshmallow`, `django.core.serializers`, `rest_framework.serializers` | `class UserSerializer(Serializer):` |
| Rust | import: `serde`, `serde_json` (with `#[derive(Serialize, Deserialize)]`) | `#[derive(Serialize)] struct User` |
| Go | import: `encoding/json` (with struct tags) | `type User struct { Name string \`json:"name"\` }` |
| Java | import: `jackson`, `gson`, `javax.xml.bind` | `@JsonProperty("name") String name` |
| Ruby | import: `active_model_serializers`, `jsonapi-serializer` | `class UserSerializer < ActiveModel::Serializer` |
| C# | import: `Newtonsoft.Json`, `System.Text.Json` | `[JsonPropertyName("name")] string Name` |

**Authority for**: api-semantics, data-persistence
**Source class**: code-derived

---

## 4. Type system

### `type-contract`
Type definitions that serve as interface contracts.

| Ecosystem | Detection | Examples |
|---|---|---|
| JS/TS | convention: `interface *`, `type * =` in `.ts` files (excluding implementations) | `interface User { id: string; email: string }` |
| Python | import: `typing`, `pydantic` (BaseModel as type), convention: `Protocol` classes | `class UserProtocol(Protocol):` |
| Rust | convention: `trait *` definitions | `trait UserRepository { fn find(&self, id: &str) -> Option<User>; }` |
| Go | convention: `interface *` type definitions | `type UserRepository interface { Find(id string) (*User, error) }` |
| Java | convention: `interface *` definitions | `interface UserRepository { User find(String id); }` |
| Ruby | convention: modules included as contracts (duck typing via `respond_to?`) | Less structured — detect via module inclusion |
| C# | convention: `interface *` definitions | `interface IUserRepository { User Find(string id); }` |
| PHP | convention: `interface *` definitions | `interface UserRepositoryInterface` |

**Authority for**: api-semantics, architecture
**Source class**: code-derived

### `enum-definition`
Enums, discriminated unions, sum types.

| Ecosystem | Detection | Examples |
|---|---|---|
| JS/TS | convention: `enum *`, `type * = 'A' \| 'B'`, `z.enum(['A', 'B'])` | `enum Status { PENDING, ACTIVE }` |
| Python | import: `enum` | `class Status(Enum): PENDING = 'pending'` |
| Rust | convention: `enum *`, `#[derive(strum)]` | `enum Status { Pending, Active }` |
| Go | convention: `type * int` / `iota` patterns | `type Status int; const ( Pending Status = iota ...)` |
| Java | convention: `enum *` | `enum Status { PENDING, ACTIVE }` |
| Ruby | convention: classes with frozen string constants or `enum_` methods | Less structured |
| C# | convention: `enum *` | `enum Status { Pending, Active }` |
| PHP | convention: `enum *` (PHP 8.1+) | `enum Status: string { case Pending = 'pending'; }` |

**Authority for**: domain-rules, api-semantics
**Source class**: code-derived

---

## 5. Error handling

### `error-definition`
Custom error classes, error codes, error response schemas.

| Ecosystem | Detection | Examples |
|---|---|---|
| JS/TS | convention: `class * extends Error`, `class *Error`, `export const *ErrorCode` | `class ValidationError extends Error` |
| Python | convention: `class *Error(Exception)`, `class *Error(BaseException)` | `class ValidationError(Exception):` |
| Rust | convention: `enum *Error`, `#[derive(thiserror::Error)]` | `#[derive(Error)] enum AppError { ... }` |
| Go | convention: `type *Error struct`, `var Err* = errors.New` | `type ValidationError struct { ... }` |
| Java | convention: `class *Exception extends`, `class *Error extends` | `class ValidationException extends RuntimeException` |
| Ruby | convention: `class *Error < StandardError` | `class ValidationError < StandardError` |
| C# | convention: `class *Exception :` | `class ValidationException : Exception` |
| PHP | convention: `class *Exception extends`, `class *Error extends` | `class ValidationException extends Exception` |
| Any | glob: `**/errors/**`, `**/error-codes.{json,yaml,yml,ts,py}` | Error catalog files |

**Authority for**: error-handling, operational
**Source class**: code-derived

---

## 6. Events & messaging

### `event-schema`
Event/message definitions.

| Ecosystem | Detection | Examples |
|---|---|---|
| JS/TS | import: `kafkajs`, `amqplib`, `@aws-sdk/client-sns`, `@aws-sdk/client-sqs` + event class patterns | `class OrderCreated { constructor(public readonly data: OrderData) {} }` |
| Python | import: `kafka-python`, `pika`, `confluent-kafka` + event class patterns | `class OrderCreated:` |
| Rust | import: `rdkafka`, `lapin` + event struct patterns | `struct OrderCreated { ... }` |
| Go | import: `segmentio/kafka-go`, `streadway/amqp` + event struct patterns | `type OrderCreated struct { ... }` |
| Java | import: `org.apache.kafka`, `org.springframework.kafka`, `com.rabbitmq` | `class OrderCreatedEvent { ... }` |
| Any | glob: `**/events/**`, `**/messages/**`, `**/topics/**` | Event class directory |
| Any | import/glob: CloudEvents | `cloudevents.*` files |

**Authority for**: protocol-behavior, domain-rules
**Source class**: code-derived

### `message-queue-config`
Queue/exchange/topic configuration.

| Ecosystem | Detection | Examples |
|---|---|---|
| Any | glob: `**/queue*.{json,yaml,yml,toml}`, `**/topics*.{json,yaml,yml}` | Queue config |
| JS/TS | import: `bull`, `bullmq` + convention: `new Queue(` | BullMQ queue definitions |
| Python | import: `celery` + convention: `@app.task`, `@shared_task` | Celery task definitions |
| Ruby | import: `sidekiq` + convention: `class *Job`, `class *Worker` | Sidekiq job definitions |
| Java | import: `org.springframework.amqp`, `org.quartz` | Spring scheduler/RabbitMQ config |

**Authority for**: operational, reliability
**Source class**: project-doc

---

## 7. Configuration

### `config-schema`
Environment variable definitions, config validation.

| Ecosystem | Detection | Examples |
|---|---|---|
| JS/TS | import: `dotenv`, `convict`, `envalid`, `@t3-oss/env-nextjs`, `zod` (env schemas) | `const env = z.object({}).parse(process.env)` |
| Python | import: `pydantic-settings`, `python-decouple`, `dynaconf` | `class Settings(BaseSettings):` |
| Rust | import: `config`, `envy`, `figment` | Config structs with serde |
| Go | import: `viper`, `envconfig`, `godotenv` | `type Config struct { ... }` |
| Java | import: `spring-boot` (application.properties/yml) | `@ConfigurationProperties` classes |
| Ruby | import: `dotenv`, `figaro` | `.env` files, `config/application.yml` |
| Any | glob: `.env.example`, `.env.schema`, `**/config*.{json,yaml,yml,toml}` | Config schema files |

**Authority for**: configuration, operational
**Source class**: code-derived

### `framework-config`
Framework configuration files.

| Ecosystem | Detection | Examples |
|---|---|---|
| JS/TS | glob: `next.config.*`, `vite.config.*`, `nuxt.config.*`, `astro.config.*`, `remix.config.*`, `webpack.config.*`, `wrangler.toml`, `vercel.json` | `next.config.ts` |
| Python | glob: `settings.py`, `config.py`, `pytest.ini`, `pyproject.toml [tool.*]` | Django settings |
| Rust | glob: `Cargo.toml`, `rocket.toml`, `config/*.toml` | Cargo.toml |
| Go | glob: `go.mod`, `*.go` (with `//go:build` tags), `golangci-lint` config | `go.mod` |
| Java | glob: `application.{properties,yml}`, `pom.xml`, `build.gradle` | Spring config |
| Ruby | glob: `config/application.rb`, `config/environments/*.rb`, `Gemfile` | Rails config |
| C# | glob: `appsettings.{json,yaml}`, `web.config`, `app.config` | .NET config |
| PHP | glob: `php.ini`, `config/*.php`, `.env` | Laravel config |

**Authority for**: api-semantics, deployment
**Source class**: project-doc

### `build-config`
Build tooling configuration.

| Ecosystem | Detection | Examples |
|---|---|---|
| JS/TS | glob: `tsconfig*.json`, `babel.config.*`, `esbuild.config.*`, `swc.config.*`, `turbo.json`, `nx.json`, `rspack.config.*` | `tsconfig.json` |
| Python | glob: `pyproject.toml`, `setup.cfg`, `tox.ini`, `Makefile` | `pyproject.toml` |
| Rust | glob: `Cargo.toml`, `.cargo/config.toml` | `Cargo.toml` |
| Go | glob: `Makefile`, `.goreleaser.yml`, `Taskfile.yml` | `Makefile` |
| Java | glob: `pom.xml`, `build.gradle`, `gradle.properties`, `settings.gradle` | `build.gradle` |
| Ruby | glob: `Rakefile`, `Gemfile`, `bin/*` | `Rakefile` |
| C# | glob: `*.csproj`, `*.sln`, `Directory.Build.props` | `*.csproj` |
| PHP | glob: `composer.json`, `phpunit.xml`, `Makefile` | `composer.json` |

**Authority for**: developer-experience, deployment
**Source class**: project-doc

---

## 8. Infrastructure

### `iac`
Infrastructure as code.

| Ecosystem | Detection | Examples |
|---|---|---|
| Any | glob: `*.tf`, `*.tf.json` | Terraform |
| Any | glob: `*.pulumi.*`, `Pulumi.yaml` | Pulumi |
| Any | glob: `*.template.json`, `*.template.yaml` (CloudFormation) | AWS CloudFormation |
| Any | glob: `cdk*.ts`, `cdk*.py`, `cdk*.java` | AWS CDK |
| Any | glob: `*.yml` in `ansible/`, `playbooks/` | Ansible |
| Any | glob: `*.pp` (Puppet), `*.sls` (Salt) | Other IaC |

**Authority for**: deployment, operational
**Source class**: project-doc

### `container-config`
Container/orchestration config.

| Ecosystem | Detection | Examples |
|---|---|---|
| Any | glob: `Dockerfile*`, `docker-compose*.{yml,yaml}` | Docker |
| Any | glob: `*.yaml` in `k8s/`, `kubernetes/`, `manifests/`, `deploy/` | Kubernetes manifests |
| Any | glob: `Chart.yaml`, `values.yaml`, `templates/**` | Helm charts |
| Any | glob: `*.yaml` in `.argocd/`, `argocd-*` | ArgoCD |
| Any | glob: `skaffold.yaml`, `tilt.yaml`, `devspace.yaml` | Dev tooling |

**Authority for**: deployment, operational
**Source class**: project-doc

### `pipeline-definition`
CI/CD pipeline definitions.

| Ecosystem | Detection | Examples |
|---|---|---|
| Any | glob: `.github/workflows/*.{yml,yaml}` | GitHub Actions |
| Any | glob: `.gitlab-ci.yml`, `.gitlab-ci/**/*.yml` | GitLab CI |
| Any | glob: `Jenkinsfile`, `jenkins/**` | Jenkins |
| Any | glob: `.circleci/config.yml` | CircleCI |
| Any | glob: `azure-pipelines.yml` | Azure DevOps |
| Any | glob: `bitbucket-pipelines.yml` | Bitbucket Pipelines |
| Any | glob: `Taskfile.yml`, `.drone.yml` | Other CI |

**Authority for**: delivery, operational
**Source class**: project-doc

---

## 9. Security

### `security-policy`
Access control rules, CORS, CSP, authorization.

| Ecosystem | Detection | Examples |
|---|---|---|
| JS/TS | import: `cors`, `helmet`, `@casl/*`, `next-auth` (with policies) | `app.use(cors({ origin: '...' }))` |
| Python | import: `django-cors-headers`, `django-csp`, `guardian`, `rules` | `CORS_ALLOW_ORIGINS = [...]` |
| Rust | import: `tower-http` (cors, auth), `actix-cors` | CORS middleware config |
| Go | import: `rs/cors`, `gin-contrib/cors`, `go-chi/cors` | `cors.New(cors.Options{...})` |
| Java | import: `spring-security`, `javax.servlet` filters | `@PreAuthorize("hasRole('ADMIN')")` |
| Ruby | import: `rack-cors`, `pundit`, `cancancan` | `class UserPolicy` (Pundit) |
| C# | import: `Microsoft.AspNetCore.Authorization`, `Microsoft.AspNetCore.Cors` | `[Authorize(Roles = "Admin")]` |
| PHP | import: `laravel/sanctum`, `spatie/laravel-permission` | `Gate::define('update-post', ...)` |
| Any | glob: `**/security/**`, `**/policies/**`, `**/permissions/**` | Policy files |

**Authority for**: security, operational
**Source class**: project-doc

### `auth-definition`
Authentication configuration.

| Ecosystem | Detection | Examples |
|---|---|---|
| JS/TS | import: `next-auth`, `passport`, `lucia`, `better-auth`, `@auth/*`, `jsonwebtoken` | `export const authOptions = { ... }` (NextAuth) |
| Python | import: `django.contrib.auth`, `fastapi.security`, `python-jose`, `passlib` | `OAuth2PasswordBearer` |
| Rust | import: `jsonwebtoken`, `argon2`, `bcrypt` | Auth middleware |
| Go | import: `golang-jwt/jwt`, `alexedwards/scs`, `go-oauth2` | JWT middleware |
| Java | import: `spring-security-oauth2`, `jsonwebtoken` | `SecurityFilterChain` config |
| Ruby | import: `devise`, `warden`, `omniauth` | `devise :for => :users` |
| C# | import: `Microsoft.AspNetCore.Authentication.*` | `builder.Services.AddAuthentication(...)` |
| PHP | import: `laravel/sanctum`, `laravel/passport` | `Auth::guard('api')` |

**Authority for**: security, operational
**Source class**: project-doc

### `secrets-policy`
Secrets management policies.

| Ecosystem | Detection | Examples |
|---|---|---|
| Any | glob: `.env.example`, `.env.schema` (env var policies) | Env var documentation |
| Any | glob: `vault/**`, `secrets/**`, `.secrets/**` (should NOT be committed) | Vault config |
| JS/TS | import: `@hashicorp/vault`, `aws-sdk/secrets-manager` | Secrets manager client |
| Python | import: `hvac` (Vault), `boto3` (AWS Secrets Manager) | Secrets client |
| Any | glob: `*.gpg`, `*.pgp`, `*.key` (should NOT be committed) | Key files |

**Authority for**: security, configuration
**Source class**: project-doc

---

## 10. Observability

### `slo-definition`
SLOs, SLAs, error budgets.

| Ecosystem | Detection | Examples |
|---|---|---|
| Any | glob: `**/slo*.{yaml,yml,json,md}`, `**/sla*.{yaml,yml,json,md}` | SLO definitions |
| Any | glob: `**/error-budget*.{yaml,yml,json}` | Error budget config |
| Any | glob: `**/objectives*.{yaml,yml}` | Service objectives |

**Authority for**: reliability, operational
**Source class**: project-doc

### `monitoring-config`
Dashboards, alerts, metrics, traces.

| Ecosystem | Detection | Examples |
|---|---|---|
| Any | glob: `**/grafana/**`, `**/dashboards/**`, `*.grafana.json` | Grafana dashboards |
| Any | glob: `**/alerts*.{yaml,yml}`, `**/prometheus/**` | Prometheus alerts |
| Any | glob: `**/datadog/**`, `**/synthetics/**` | Datadog config |
| JS/TS | import: `@opentelemetry/*`, `@sentry/node`, `@sentry/react` | OpenTelemetry/Sentry config |
| Python | import: `opentelemetry`, `sentry-sdk`, `prometheus_client` | OTel/Sentry config |
| Rust | import: `opentelemetry`, `tracing-opentelemetry`, `sentry` | Tracing config |
| Go | import: `go.opentelemetry.io`, `prometheus/client_golang` | Metrics config |
| Java | import: `io.opentelemetry`, `io.micrometer` | Micrometer/OTel config |

**Authority for**: observability, reliability
**Source class**: project-doc

### `logging-config`
Structured logging schemas, log levels, routing.

| Ecosystem | Detection | Examples |
|---|---|---|
| JS/TS | import: `winston`, `pino`, `bunyan`, `loglevel` | Logger config |
| Python | import: `logging`, `structlog`, `loguru` | `logging.config.dictConfig(...)` |
| Rust | import: `tracing`, `tracing-subscriber`, `env_logger` | `tracing_subscriber::fmt()` init |
| Go | import: `slog`, `zap`, `logrus` | Logger setup |
| Java | import: `org.slf4j`, `log4j`, `logback` | `logback.xml` |
| Ruby | import: `semantic_logger`, `ougai`, Rails `config.log_level` | Logger config |
| Any | glob: `**/log*.{xml,json,yaml,yml}` | Log config files |

**Authority for**: observability, operational
**Source class**: project-doc

---

## 11. Architecture

### `architecture-model`
Component diagrams, boundary definitions, data flow.

| Ecosystem | Detection | Examples |
|---|---|---|
| Any | glob: `.ddd/models/**` | DDD domain models |
| Any | glob: `**/architecture/**`, `**/adr/**`, `docs/adr/**` | Architecture docs |
| Any | glob: `*.c4`, `*.archimate`, `**/c4/**` | C4/ArchiMate models |
| Any | glob: `**/diagrams/**`, `*.puml`, `*.mmd`, `*.drawio` | Diagram files |

**Authority for**: architecture, domain-rules
**Source class**: project-doc

### `dependency-rule`
Dependency constraints, module boundaries.

| Ecosystem | Detection | Examples |
|---|---|---|
| JS/TS | glob: `.dependency-cruiser.*`, `dependency-cruiser.json` | dependency-cruiser rules |
| JS/TS | glob: `**/.eslintrc*` with `no-restricted-imports`, `import/no-restricted-paths` | ESLint boundary rules |
| JS/TS | glob: `project.json`, `nx.json` with `implicitDependencies` | Nx project boundaries |
| Python | glob: `**/.archunit*`, `**/import-linter*` | import-linter / archunit-python |
| Java | import: `com.tngtech.archunit` | ArchUnit test rules |
| Any | glob: `**/boundaries*.{json,yaml,yml}` | Custom boundary definitions |

**Authority for**: architecture, developer-experience
**Source class**: code-derived

### `module-boundary`
Module/package structure, public API exports.

| Ecosystem | Detection | Examples |
|---|---|---|
| JS/TS | convention: `index.ts`/`index.js` (barrel files), `package.json` `exports` field | `"exports": { ".": "./dist/index.js" }` |
| Python | convention: `__init__.py` with `__all__` | `__all__ = ['User', 'Order']` |
| Rust | convention: `pub mod *` declarations, `lib.rs` | `pub mod users;` |
| Go | convention: `package *` declarations, `go.mod` module path | `package users` |
| Java | convention: `module-info.java` (JPMS) | `module com.example.users { exports com.example.users; }` |
| Ruby | convention: `lib/**` directory structure, `require_relative` patterns | Module structure |

**Authority for**: architecture, api-semantics
**Source class**: code-derived

---

## 12. Code standards

### `coding-standard`
Linting rules, formatting config, naming conventions.

| Ecosystem | Detection | Examples |
|---|---|---|
| JS/TS | glob: `.eslintrc*`, `eslint.config.*`, `.prettierrc*`, `biome.json`, `.editorconfig` | ESLint config |
| Python | glob: `pyproject.toml [tool.ruff]`, `.flake8`, `.pylintrc`, `.pycodestyle`, `setup.cfg [flake8]` | Ruff/Flake8 config |
| Rust | glob: `clippy.toml`, `rustfmt.toml`, `.rustfmt.toml` | Clippy/rustfmt config |
| Go | glob: `.golangci.yml`, `.golangci.yaml`, `.golangci.toml` | golangci-lint config |
| Java | glob: `.checkstyle.xml`, `.spotbugs.xml`, `spotless` config | Checkstyle config |
| Ruby | glob: `.rubocop.yml`, `.standard.yml` | RuboCop config |
| C# | glob: `.editorconfig`, `Directory.Build.props` with analyzers | .NET analyzer config |
| PHP | glob: `.php-cs-fixer.php`, `phpcs.xml`, `.phpstan.neon` | PHP-CS-Fixer config |
| Any | glob: `.editorconfig` | General editor config |

**Authority for**: developer-experience, architecture
**Source class**: project-doc

### `test-artifact`
Test files, fixtures, test configuration.

| Ecosystem | Detection | Examples |
|---|---|---|
| JS/TS | glob: `**/*.test.*`, `**/*.spec.*`, `**/__tests__/**`, `vitest.config.*`, `jest.config.*`, `playwright.config.*` | Test files + config |
| Python | glob: `**/test_*.py`, `**/*_test.py`, `**/tests/**`, `conftest.py`, `pytest.ini` | Test files + config |
| Rust | glob: `**/tests/**`, `#[cfg(test)]` blocks, `Cargo.toml [dev-dependencies]` | Integration tests |
| Go | glob: `**/*_test.go` | Test files |
| Java | glob: `src/test/**`, `**/*Test.java`, `**/*IT.java` | JUnit tests |
| Ruby | glob: `spec/**`, `test/**`, `.rspec`, `spec_helper.rb` | RSpec/Minitest |
| C# | glob: `**/*Test.cs`, `**/*Tests.cs`, `*.Test.csproj` | xUnit/NUnit tests |
| PHP | glob: `tests/**`, `**/*Test.php`, `phpunit.xml` | PHPUnit tests |

**Authority for**: testing, verification
**Source class**: code-derived

---

## 13. Product & feature

### `feature-flag`
Flag definitions, rules, ownership.

| Ecosystem | Detection | Examples |
|---|---|---|
| JS/TS | import: `@launchdarkly/*`, `@unleash/proxy-client-react`, `@growthbook/growthbook` | Flag SDK config |
| Python | import: `ldclient`, `UnleashClient` | Flag SDK config |
| Ruby | import: `flipper`, `rollout` | Feature flag definitions |
| Any | glob: `**/flags*.{json,yaml,yml}`, `**/features*.{json,yaml,yml}` | Flag config files |
| Any | glob: `**/feature-flags/**`, `**/feature_flags/**` | Flag directory |

**Authority for**: product-behavior, operational
**Source class**: project-doc

### `api-versioning`
Versioning scheme, deprecation notices, changelog.

| Ecosystem | Detection | Examples |
|---|---|---|
| JS/TS | convention: `/api/v1/`, `/api/v2/` in route definitions | `app.use('/api/v1', router)` |
| Python | convention: URL prefixes, DRF `API_VERSION` setting | `VERSION = 'v1'` (DRF) |
| Any | glob: `CHANGELOG.md`, `CHANGES.md`, `RELEASES.md` | Changelog files |
| Any | glob: `**/deprecat*.{md,json,yaml}` | Deprecation notices |

**Authority for**: compatibility, api-semantics
**Source class**: project-doc

---

## 14. Compliance & privacy

### `compliance-rule`
Regulatory requirements (GDPR, HIPAA, PCI-DSS, SOC2).

| Ecosystem | Detection | Examples |
|---|---|---|
| Any | glob: `**/compliance/**`, `**/gdpr/**`, `**/hipaa/**`, `**/pci/**`, `**/soc2/**` | Compliance docs |
| Any | glob: `**/privacy*.{md,policy,txt}`, `**/consent*.{md,txt}` | Privacy policies |
| Any | glob: `**/data-processing*.{md,txt,yaml}` | DPA documents |

**Authority for**: security, compliance
**Source class**: project-doc

### `data-retention`
Retention policies, deletion rules, data residency.

| Ecosystem | Detection | Examples |
|---|---|---|
| Any | glob: `**/retention*.{json,yaml,yml,md}`, `**/data-policy*.{json,yaml,yml,md}` | Retention config |
| JS/TS | import: `@upstash/redis` (with TTL), database models with `expiresAt` fields | TTL config |
| Python | convention: `@property def expires_at`, models with `retention_days` | Retention fields |
| Any | glob: `**/archival*.{json,yaml,yml}`, `**/purge*.{json,yaml,yml}` | Archival/purge config |

**Authority for**: compliance, data-persistence
**Source class**: project-doc

### `audit-trail`
Audit log definitions, audit event schemas.

| Ecosystem | Detection | Examples |
|---|---|---|
| JS/TS | convention: `class *Audit*`, `class *AuditLog*`, `export const *AuditEvent*` | Audit classes |
| Python | convention: `class *Audit*`, `class *AuditLog*` | Audit classes |
| Any | glob: `**/audit/**`, `**/audit-log*.{json,yaml,yml,ts,py}` | Audit log files |
| Any | glob: `**/trail/**`, `**/event-log/**` | Event trail files |
| Java | import: `spring-boot-actuator` (audit events), `org.springframework.boot.actuate.audit` | Spring Audit |

**Authority for**: security, compliance
**Source class**: code-derived

---

## 15. Operations & performance

### `runbook`
Operational procedures, incident response, escalation.

| Ecosystem | Detection | Examples |
|---|---|---|
| Any | glob: `**/runbook*`, `**/runbooks/**`, `**/playbook*`, `**/playbooks/**` | Runbook files |
| Any | glob: `**/incident*`, `**/incidents/**`, `**/on-call*`, `**/oncall/**` | Incident procedures |
| Any | glob: `**/escalation*`, `**/ops/**` | Escalation paths |

**Authority for**: operational, reliability
**Source class**: project-doc

### `deployment-config`
Deployment strategies, rollout config.

| Ecosystem | Detection | Examples |
|---|---|---|
| Any | glob: `**/deploy*.{yaml,yml,json}`, `**/rollout*.{yaml,yml}` | Deployment config |
| JS/TS | glob: `vercel.json`, `netlify.toml`, `render.yaml`, `fly.toml` | Platform deploy config |
| Any | glob: `**/canary*.{yaml,yml}`, `**/blue-green*.{yaml,yml}` | Strategy config |
| Any | glob: `**/helm/**`, `**/kustomize/**` | K8s deploy tooling |

**Authority for**: deployment, operational
**Source class**: project-doc

### `cache-policy`
Caching rules, TTL, invalidation, cache key structure.

| Ecosystem | Detection | Examples |
|---|---|---|
| JS/TS | import: `next/cache`, `lru-cache`, `node-cache`, `@upstash/redis` + convention: `cache: '...'` in fetch calls | Next.js cache directives |
| Python | import: `django.core.cache`, `redis`, `cachetools`, `functools.lru_cache` | `@cache_page(600)` |
| Rust | import: `moka`, `cached`, `redis` | Cache macros |
| Go | import: `go-redis`, `patrickmn/go-cache` | Cache client |
| Any | glob: `**/cache*.{json,yaml,yml}`, `**/cache-config*` | Cache config files |

**Authority for**: reliability, performance
**Source class**: project-doc

### `rate-limit`
Throttling rules, quotas, per-tenant limits.

| Ecosystem | Detection | Examples |
|---|---|---|
| JS/TS | import: `express-rate-limit`, `@upstash/ratelimit`, `rate-limiter-flexible` | Rate limiter middleware |
| Python | import: `django-ratelimit`, `slowapi`, `flask-limiter` | `@ratelimit(key='ip', rate='100/h')` |
| Go | import: `ulule/limiter`, `didip/tollbooth` | Rate limiter |
| Any | glob: `**/rate-limit*.{json,yaml,yml}`, `**/quota*.{json,yaml,yml}` | Rate limit config |

**Authority for**: operational, security
**Source class**: project-doc

---

## Extension

To add a new artifact class:

1. Define `id`, `description`, `authority_for`, `source_class`
2. Define at least one detection pattern for at least one ecosystem
3. Add it to the appropriate group in this file
4. Record it in the project's Knowledge Map
5. Project-scoped — does not propagate to other projects
