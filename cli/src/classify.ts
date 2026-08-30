/**
 * classify(change) -> domains
 *
 * Matches a change description against the 18-dimension knowledge taxonomy
 * (SPEC.md knowledge map dimensions) using keyword matching.
 */

export interface DomainDimension {
  id: number;
  name: string;
  keywords: string[];
}

export interface DomainMatch {
  id: number;
  name: string;
  score: number;
  matched_keywords: string[];
}

export const TAXONOMY: DomainDimension[] = [
  {
    id: 1,
    name: "Product and domain",
    keywords: ["product", "domain", "business", "feature", "user story", "requirement", "roadmap", "use case", "customer"],
  },
  {
    id: 2,
    name: "Language, runtime, and framework",
    keywords: ["typescript", "javascript", "python", "rust", "golang", "java", "node", "bun", "deno", "runtime", "framework", "react", "nextjs", "next.js", "language", "compiler", "sdk"],
  },
  {
    id: 3,
    name: "Architecture and distribution",
    keywords: ["architecture", "microservice", "monolith", "distributed", "api", "service", "module", "component", "boundary", "layer", "hexagonal", "event-driven"],
  },
  {
    id: 4,
    name: "Data and persistence",
    keywords: ["database", "schema", "sql", "nosql", "mongodb", "postgres", "migration", "storage", "persistence", "data model", "query", "table", "index", "orm", "cache"],
  },
  {
    id: 5,
    name: "Security, privacy, and compliance",
    keywords: ["security", "auth", "authentication", "authorization", "oauth", "privacy", "compliance", "gdpr", "encryption", "vulnerability", "secret", "token", "xss", "csrf", "injection", "threat"],
  },
  {
    id: 6,
    name: "UX, accessibility, and design",
    keywords: ["ux", "ui", "accessibility", "a11y", "design", "css", "layout", "screen reader", "wcag", "usability", "interaction", "responsive", "dark mode"],
  },
  {
    id: 7,
    name: "Reliability, performance, and operations",
    keywords: ["reliability", "performance", "latency", "throughput", "uptime", "sla", "slo", "capacity", "optimization", "benchmark", "profiling", "operations"],
  },
  {
    id: 8,
    name: "Testing and verification",
    keywords: ["test", "testing", "verification", "coverage", "e2e", "unit test", "integration test", "qa", "assertion", "tdd", "fixture", "mock"],
  },
  {
    id: 9,
    name: "Delivery, migration, and compatibility",
    keywords: ["migration", "rollout", "release", "backwards compatible", "compatibility", "deprecation", "versioning", "delivery", "changelog", "upgrade path", "breaking change"],
  },
  {
    id: 10,
    name: "Organization and ownership",
    keywords: ["ownership", "team", "oncall", "on-call", "organization", "responsibility", "maintainer", "codeowner", "raci", "stakeholder"],
  },
  {
    id: 11,
    name: "Observability and monitoring",
    keywords: ["observability", "monitoring", "logging", "metrics", "tracing", "alerting", "dashboard", "telemetry", "opentelemetry", "span", "log"],
  },
  {
    id: 12,
    name: "Concurrency and async",
    keywords: ["concurrency", "async", "await", "parallel", "race condition", "mutex", "thread", "worker", "queue", "promise", "event loop", "lock"],
  },
  {
    id: 13,
    name: "Deployment, infrastructure, and IaC",
    keywords: ["deployment", "deploy", "infrastructure", "iac", "terraform", "kubernetes", "k8s", "docker", "ci", "cd", "pipeline", "cloud", "aws", "container", "serverless"],
  },
  {
    id: 14,
    name: "Configuration and secrets management",
    keywords: ["configuration", "config", "environment variable", "env var", "secrets management", "feature flag", "settings", "dotenv", "parameter"],
  },
  {
    id: 15,
    name: "Dependency and supply chain",
    keywords: ["dependency", "dependencies", "package", "npm", "supply chain", "sbom", "vulnerability scanning", "upgrade", "lockfile", "vendor", "third-party"],
  },
  {
    id: 16,
    name: "Resilience and error handling",
    keywords: ["resilience", "error handling", "retry", "circuit breaker", "fallback", "graceful", "timeout", "exception handling", "backoff", "failover"],
  },
  {
    id: 17,
    name: "Internationalization and localization",
    keywords: ["i18n", "l10n", "internationalization", "localization", "translation", "locale", "timezone", "unicode", "rtl"],
  },
  {
    id: 18,
    name: "Developer experience and tooling",
    keywords: ["dx", "developer experience", "tooling", "cli", "ide", "lint", "linter", "formatter", "scaffolding", "codegen", "hot reload", "debugging"],
  },
];

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function matchesKeyword(text: string, keyword: string): boolean {
  // Word-boundary match where possible; substring match for phrases with
  // non-word characters at the edges (e.g. "next.js").
  const pattern = escapeRegExp(keyword.toLowerCase());
  const needsLeftBoundary = /^\w/.test(keyword);
  const needsRightBoundary = /\w$/.test(keyword);
  const re = new RegExp(
    `${needsLeftBoundary ? "\\b" : ""}${pattern}${needsRightBoundary ? "\\b" : ""}`,
    "i",
  );
  return re.test(text);
}

/**
 * Classify a change description into taxonomy dimensions.
 * Returns matching domains sorted by score (desc), then id (asc).
 */
export function classify(change: string): DomainMatch[] {
  const results: DomainMatch[] = [];
  for (const dim of TAXONOMY) {
    const matched = dim.keywords.filter((kw) => matchesKeyword(change, kw));
    if (matched.length > 0) {
      results.push({ id: dim.id, name: dim.name, score: matched.length, matched_keywords: matched });
    }
  }
  return results.sort((a, b) => b.score - a.score || a.id - b.id);
}

export function classifyReport(change: string) {
  const domains = classify(change);
  return {
    change,
    domains,
    domain_count: domains.length,
    taxonomy_size: TAXONOMY.length,
  };
}
