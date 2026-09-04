import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { builtinModules } from "node:module";
import { basename, dirname, extname, join, normalize } from "node:path";
import type { ChangeEnvelope } from "./assurance-types";
import { nowIso } from "./utils";

export interface ScopeChangeOptions {
  base: string;
  head: string;
  risk?: ChangeEnvelope["risk"];
  owner?: string;
  /** Notified when an existing envelope for the same range is regenerated because the detector version advanced. */
  onRegenerate?: (info: { id: string; from: string | null; to: string }) => void;
}

/**
 * Detector version: also the envelope-cache key. Idempotency holds per
 * (base, head, detector version); when the detector advances, the cached
 * envelope for a range is regenerated in place (same ENV id) so schema
 * upgrades never require hand-deleting artifacts.
 */
const DETECTOR_VERSION = "0.6.0";

const TYPESCRIPT_EXTENSIONS = new Set([".ts", ".tsx", ".mts", ".cts"]);
const FRONTEND_EXTENSIONS = new Set([".tsx", ".jsx", ".css", ".scss", ".sass", ".vue", ".svelte"]);
const FRONTEND_PATHS = /(^|\/)(app|pages|public|styles?|components?)\//i;
const CONTRACT_PATTERNS = [
  /(^|\/)openapi\.(json|ya?ml)$/i,
  /(^|\/).+\.schema\.json$/i,
  /(^|\/).+\.openapi\.(json|ya?ml)$/i,
];

export function scopeChange(
  projectRoot: string,
  bookDir: string,
  options: ScopeChangeOptions,
): ChangeEnvelope {
  assertRevision(projectRoot, options.base);
  assertRevision(projectRoot, options.head);
  const resolvedBase = resolveRevision(projectRoot, options.base);
  const resolvedHead = resolveRevision(projectRoot, options.head);

  // Idempotent on (base, head, detector version): re-running the same range
  // with the same detector returns the existing envelope instead of
  // duplicating lineage. A range cached by an older detector is regenerated
  // in place (same ENV id) so a tool upgrade never ships with an undocumented
  // "delete the envelope by hand" migration step.
  const existing = findExistingEnvelope(bookDir, resolvedBase, resolvedHead);
  if (existing) {
    if ((existing.detector?.version ?? "") === DETECTOR_VERSION) return existing;
    options.onRegenerate?.({
      id: existing.id,
      from: existing.detector?.version ?? null,
      to: DETECTOR_VERSION,
    });
  }
  const envelopeId = existing?.id ?? nextCaseArtifactId(bookDir, "ENV");

  const changedFiles = git(projectRoot, [
    "diff",
    "--name-only",
    "--diff-filter=ACMRTD",
    options.base,
    options.head,
    "--",
  ])
    .split("\n")
    .map((path) => path.trim())
    .filter(Boolean)
    .sort();

  const changedSymbols: string[] = [];
  const affectedDependencies = new Set<string>();
  const affectedServices = new Set<string>();
  const affectedPlatforms = new Set<string>();
  const boundaryFiles = new Set<string>();
  const frontendFiles = new Set<string>();
  const dependenciesBefore = readDeclaredDependencies(projectRoot, options.base);
  const dependenciesAfter = readDeclaredDependencies(projectRoot, options.head);
  const declaredDependencies = new Set([...dependenciesBefore.keys(), ...dependenciesAfter.keys()]);
  for (const dependency of declaredDependencies) {
    if (dependenciesBefore.get(dependency) !== dependenciesAfter.get(dependency)) {
      affectedDependencies.add(dependency);
    }
  }
  const affectedContracts: string[] = [];
  let unsupportedFiles = 0;
  let unresolvedImports = 0;

  for (const path of changedFiles) {
    if (isContract(path)) affectedContracts.push(path);
    if (isFrontendFile(path)) frontendFiles.add(path);
    // Book ledgers, project docs, and hygiene files carry no stack signals
    // and no boundary-confidence penalty. Without this, every commit that
    // advances the assurance cycle (ledger updates, docs, .gitignore) could
    // never reach "complete" confidence.
    if (isInertProjectFile(path, bookDir)) continue;
    const before = tryReadRevisionFile(projectRoot, options.base, path);
    const after = tryReadRevisionFile(projectRoot, options.head, path);
    const fileServices = extractExternalServices(`${before}\n${after}`);
    for (const service of fileServices) {
      affectedServices.add(service);
    }
    for (const platform of detectPlatforms(path, `${before}\n${after}`)) {
      affectedPlatforms.add(platform);
    }
    for (const dependency of extractStyleImports(`${before}\n${after}`)) {
      if (declaredDependencies.has(dependency)) affectedDependencies.add(dependency);
      else unresolvedImports++;
    }
    if (TYPESCRIPT_EXTENSIONS.has(extname(path))) {
      // A changed file exercises the declared external stack when it imports
      // a declared dependency or embeds a literal external service URL.
      // Symbols in such files are boundary-relevant; other symbols are
      // internal and below the supported assurance boundary.
      let exercisesStack = fileServices.length > 0;
      for (const dependency of extractBareImports(`${before}\n${after}`)) {
        if (declaredDependencies.has(dependency)) {
          affectedDependencies.add(dependency);
          exercisesStack = true;
        } else {
          unresolvedImports++;
        }
      }
      if (exercisesStack) boundaryFiles.add(path);
      const symbols = [
        ...new Set([...extractTypeScriptSymbols(before), ...extractTypeScriptSymbols(after)]),
      ];
      if (symbols.length === 0) {
        changedSymbols.push(path);
      } else {
        changedSymbols.push(...symbols.map((symbol) => `${path}#${symbol}`));
      }
    } else if (!isContract(path) && !isFrontendFile(path) && !isManifestFile(path)) {
      unsupportedFiles++;
    }
  }
  const knownConsumers = findKnownConsumers(projectRoot, options.head, changedFiles);

  const envelope: ChangeEnvelope = {
    schema_version: "0.5.0",
    id: envelopeId,
    base_revision: resolvedBase,
    head_revision: resolvedHead,
    changed_files: changedFiles,
    changed_symbols: [...new Set(changedSymbols)].sort(),
    boundary_files: [...boundaryFiles].sort(),
    declared_dependencies: [...dependenciesAfter.keys()].sort(),
    declared_dependency_versions: Object.fromEntries(
      [...dependenciesAfter]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([name, versions]) => [name, versions.split("\0")]),
    ),
    affected_dependencies: [...affectedDependencies].sort(),
    affected_services: [...affectedServices].sort(),
    affected_platforms: [...affectedPlatforms].sort(),
    affected_contracts: affectedContracts.sort(),
    frontend_files: [...frontendFiles].sort(),
    known_consumers: knownConsumers,
    risk: options.risk ?? "medium",
    owner: options.owner ?? null,
    exclusions: [],
    boundary_confidence:
      changedFiles.length > 0 && unsupportedFiles === 0 && unresolvedImports === 0
        ? "complete"
        : changedFiles.length > 0
          ? "partial"
          : "unknown",
    detector: {
      name: "proofline-typescript-contracts",
      version: DETECTOR_VERSION,
    },
    created_at: nowIso(),
  };

  const casesDir = join(bookDir, "cases");
  mkdirSync(casesDir, { recursive: true });
  writeFileSync(join(casesDir, `${envelope.id}.json`), `${JSON.stringify(envelope, null, 2)}\n`);
  return envelope;
}

export function loadChangeEnvelope(bookDir: string, idOrPath: string): ChangeEnvelope {
  const path = existsSync(idOrPath) ? idOrPath : join(bookDir, "cases", `${idOrPath}.json`);
  if (!existsSync(path)) throw new Error(`Change envelope not found: ${idOrPath}`);
  const envelope = JSON.parse(readFileSync(path, "utf8")) as ChangeEnvelope;
  if (!/^ENV-\d+$/.test(envelope.id)) {
    throw new Error(`Change envelope has invalid id: ${String(envelope.id)}`);
  }
  if (!["0.4.0", "0.5.0"].includes(envelope.schema_version)) {
    throw new Error(`Unsupported change envelope schema: ${String(envelope.schema_version)}`);
  }
  return envelope;
}

export function nextCaseArtifactId(bookDir: string, prefix: "ENV" | "CASE"): string {
  const casesDir = join(bookDir, "cases");
  if (!existsSync(casesDir)) return `${prefix}-001`;
  let maximum = 0;
  const pattern = new RegExp(`^${prefix}-(\\d+)\\.json$`);
  for (const name of readdirSync(casesDir)) {
    const match = name.match(pattern);
    if (match) maximum = Math.max(maximum, Number(match[1]));
  }
  return `${prefix}-${String(maximum + 1).padStart(3, "0")}`;
}

/** Return an existing envelope for the same resolved (base, head) range, if any. */
function findExistingEnvelope(
  bookDir: string,
  baseRevision: string,
  headRevision: string,
): ChangeEnvelope | null {
  const casesDir = join(bookDir, "cases");
  if (!existsSync(casesDir)) return null;
  for (const name of readdirSync(casesDir)) {
    if (!/^ENV-\d+\.json$/.test(name)) continue;
    const envelope = JSON.parse(readFileSync(join(casesDir, name), "utf8")) as ChangeEnvelope;
    if (envelope.base_revision === baseRevision && envelope.head_revision === headRevision) {
      return envelope;
    }
  }
  return null;
}

function extractTypeScriptSymbols(content: string): string[] {
  const symbols: string[] = [];
  const declaration =
    /^(?:export\s+)?(?:default\s+)?(?:declare\s+)?(?:async\s+)?(?:function|class|interface|type|enum|const|let|var)\s+([A-Za-z_$][\w$]*)/gm;
  for (const match of content.matchAll(declaration)) symbols.push(match[1]);
  return symbols;
}

function extractBareImports(content: string): string[] {
  const imports = new Set<string>();
  const pattern =
    /(?:import|export)\s+(?:[^"'()]*?\s+from\s+)?["']([^"']+)["']|(?:import|require)\(\s*["']([^"']+)["']\s*\)/g;
  for (const match of content.matchAll(pattern)) {
    const specifier = match[1] ?? match[2];
    if (
      !specifier ||
      specifier.startsWith(".") ||
      specifier.startsWith("node:") ||
      // Runtime-provided builtins are not external dependencies.
      specifier.startsWith("bun:") ||
      specifier.startsWith("deno:") ||
      builtinModules.includes(specifier)
    ) {
      continue;
    }
    const segments = specifier.split("/");
    imports.add(specifier.startsWith("@") ? segments.slice(0, 2).join("/") : segments[0]);
  }
  return [...imports];
}

function extractStyleImports(content: string): string[] {
  const imports = new Set<string>();
  for (const match of content.matchAll(/@(?:import|use)\s+["']([^"']+)["']/g)) {
    const specifier = match[1];
    if (!specifier || specifier.startsWith(".") || specifier.startsWith("/") || /^https?:/.test(specifier)) {
      continue;
    }
    const segments = specifier.split("/");
    imports.add(specifier.startsWith("@") ? segments.slice(0, 2).join("/") : segments[0]);
  }
  return [...imports];
}

function extractExternalServices(content: string): string[] {
  const services = new Set<string>();
  for (const match of content.matchAll(/https?:\/\/([A-Za-z0-9.-]+)/g)) {
    const host = match[1].toLowerCase();
    if (!["localhost", "127.0.0.1"].includes(host)) services.add(host);
  }
  return [...services];
}

function detectPlatforms(path: string, content: string): string[] {
  const platforms = new Set<string>();
  if (
    /(^|\/)wrangler\.(jsonc?|toml)$/i.test(path) ||
    /cloudflare-workers|@cloudflare\/workers-types|workers\.dev/i.test(content)
  ) {
    platforms.add("cloudflare-workers");
  }
  return [...platforms];
}

function isFrontendFile(path: string): boolean {
  return FRONTEND_EXTENSIONS.has(extname(path)) || FRONTEND_PATHS.test(path);
}

function readDeclaredDependencies(projectRoot: string, revision: string): Map<string, string> {
  const manifests = git(projectRoot, ["ls-tree", "-r", "--name-only", revision])
    .split("\n")
    .filter(
      (path) =>
        (path === "package.json" || path.endsWith("/package.json")) &&
        !path.split("/").includes("node_modules"),
    );
  const versionsByName = new Map<string, Set<string>>();
  for (const path of manifests) {
    const content = tryReadRevisionFile(projectRoot, revision, path);
    if (!content) continue;
    try {
      const manifest = JSON.parse(content) as Record<string, unknown>;
      for (const key of ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"]) {
        const dependencies = manifest[key];
        if (!dependencies || typeof dependencies !== "object" || Array.isArray(dependencies)) continue;
        for (const [name, version] of Object.entries(dependencies)) {
          const versions = versionsByName.get(name) ?? new Set<string>();
          versions.add(String(version));
          versionsByName.set(name, versions);
        }
      }
    } catch {
      continue;
    }
  }
  return new Map(
    [...versionsByName].map(([name, versions]) => [name, [...versions].sort().join("\0")]),
  );
}

function findKnownConsumers(projectRoot: string, revision: string, changedFiles: string[]): string[] {
  const changedModules = new Set(
    changedFiles
      .filter((path) => TYPESCRIPT_EXTENSIONS.has(extname(path)))
      .map((path) => path.slice(0, -extname(path).length)),
  );
  if (changedModules.size === 0) return [];
  const candidates = git(projectRoot, ["ls-tree", "-r", "--name-only", revision])
    .split("\n")
    .filter((path) => path && TYPESCRIPT_EXTENSIONS.has(extname(path)) && !changedFiles.includes(path));
  const consumers = new Set<string>();
  for (const path of candidates) {
    const content = readRevisionFile(projectRoot, revision, path);
    const relativeImports = [
      ...content.matchAll(
        /(?:import|export)\s+(?:[^"'()]*?\s+from\s+)?["'](\.[^"']+)["']|(?:import|require)\(\s*["'](\.[^"']+)["']\s*\)/g,
      ),
    ].map((match) => match[1] ?? match[2]);
    for (const specifier of relativeImports) {
      const resolved = normalize(join(dirname(path), specifier)).replace(/\.(tsx?|mts|cts)$/, "");
      if (changedModules.has(resolved) || [...changedModules].some((module) => resolved === `${module}/index`)) {
        consumers.add(path);
      }
    }
  }
  return [...consumers].sort();
}

function isContract(path: string): boolean {
  return CONTRACT_PATTERNS.some((pattern) => pattern.test(path));
}

/**
 * Files that carry no external-stack signal and no boundary-confidence
 * penalty: the book directory (the tool's own ledgers), root-level project
 * docs, and repository hygiene files. Their content is not scanned either,
 * so ledger issue URLs never surface as external services.
 */
function isInertProjectFile(path: string, bookDir: string): boolean {
  const bookName = basename(bookDir);
  const firstSegment = path.split("/")[0];
  if (firstSegment === bookName) return true;
  const name = path.split("/").at(-1) ?? "";
  if (!path.includes("/") && /\.md$/i.test(path)) return true;
  if (name === ".env.example" || /^\.env\.[\w.-]*example$/.test(name)) return true;
  return [
    ".gitignore",
    ".gitattributes",
    ".gitmodules",
    ".editorconfig",
    ".nvmrc",
    ".npmrc",
    "LICENSE",
    "NOTICE",
  ].includes(name);
}

/** Manifest and tool-configuration files: scanned for stack signals, but not counted as unsupported. */
function isManifestFile(path: string): boolean {
  const name = path.split("/").at(-1);
  return [
    "package.json",
    "bun.lock",
    "bun.lockb",
    "package-lock.json",
    "pnpm-lock.yaml",
    "yarn.lock",
    "tsconfig.json",
    "tsconfig.build.json",
    "wrangler.json",
    "wrangler.jsonc",
    "wrangler.toml",
  ].includes(name ?? "");
}

function readRevisionFile(projectRoot: string, revision: string, path: string): string {
  return git(projectRoot, ["show", `${revision}:${path}`]);
}

function tryReadRevisionFile(projectRoot: string, revision: string, path: string): string {
  const result = Bun.spawnSync({
    cmd: ["git", "-C", projectRoot, "show", `${revision}:${path}`],
    stdout: "pipe",
    stderr: "pipe",
  });
  return result.exitCode === 0 ? result.stdout.toString() : "";
}

function assertRevision(projectRoot: string, revision: string): void {
  git(projectRoot, ["rev-parse", "--verify", `${revision}^{commit}`]);
}

function resolveRevision(projectRoot: string, revision: string): string {
  return git(projectRoot, ["rev-parse", revision]).trim();
}

function git(projectRoot: string, args: string[]): string {
  const result = Bun.spawnSync({
    cmd: ["git", "-C", projectRoot, ...args],
    stdout: "pipe",
    stderr: "pipe",
  });
  if (result.exitCode !== 0) {
    throw new Error(`git ${args.join(" ")} failed: ${result.stderr.toString().trim()}`);
  }
  return result.stdout.toString();
}
