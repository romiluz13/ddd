import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { readText } from "./utils";

export interface SkillDiagnostic {
  skill: string;
  status: "current" | "missing" | "mismatch" | "unexpected";
  source_digest?: string;
  installed_digest?: string;
}

export interface DoctorReport {
  schema_version: "0.5.0";
  installation_root: string;
  installation_root_present: boolean;
  checks: SkillDiagnostic[];
  lock_checks: SkillDiagnostic[];
  pass: boolean;
}

export function doctor(projectRoot: string): DoctorReport {
  const sourceRoot = join(projectRoot, "skills");
  const installationRoot = join(projectRoot, ".factory", "skills");
  const installationRootPresent = existsSync(installationRoot);
  const checks: SkillDiagnostic[] = [];
  const lockChecks: SkillDiagnostic[] = [];

  if (existsSync(sourceRoot) && installationRootPresent) {
    const sourceSkills = new Set<string>();
    for (const skill of readdirSync(sourceRoot).sort()) {
      const sourcePath = join(sourceRoot, skill, "SKILL.md");
      if (!existsSync(sourcePath)) continue;
      sourceSkills.add(skill);
      const sourceDigest = computeFolderDigest(join(sourceRoot, skill));
      const installedPath = join(installationRoot, skill, "SKILL.md");
      if (!existsSync(installedPath)) {
        checks.push({ skill, status: "missing", source_digest: sourceDigest });
        continue;
      }
      const installedDigest = computeFolderDigest(join(installationRoot, skill));
      checks.push({
        skill,
        status: installedDigest === sourceDigest ? "current" : "mismatch",
        source_digest: sourceDigest,
        installed_digest: installedDigest,
      });
    }
    for (const skill of readdirSync(installationRoot).sort()) {
      const installedPath = join(installationRoot, skill, "SKILL.md");
      if (sourceSkills.has(skill) || !existsSync(installedPath)) continue;
      checks.push({
        skill,
        status: "unexpected",
        installed_digest: computeFolderDigest(join(installationRoot, skill)),
      });
    }
  }

  const lockPath = join(projectRoot, "skills-lock.json");
  if (existsSync(lockPath) && existsSync(sourceRoot)) {
    const lock = JSON.parse(readText(lockPath)) as {
      skills?: Record<string, { computedHash?: string }>;
    };
    for (const [skill, entry] of Object.entries(lock.skills ?? {})) {
      const skillPath = join(sourceRoot, skill);
      if (!existsSync(join(skillPath, "SKILL.md"))) {
        lockChecks.push({ skill, status: "missing" });
        continue;
      }
      const sourceDigest = computeFolderDigest(skillPath);
      lockChecks.push({
        skill,
        status: sourceDigest === entry.computedHash ? "current" : "mismatch",
        source_digest: sourceDigest,
        installed_digest: entry.computedHash,
      });
    }
  }

  return {
    schema_version: "0.5.0",
    installation_root: installationRoot,
    installation_root_present: installationRootPresent,
    checks,
    lock_checks: lockChecks,
    pass:
      checks.every((check) => check.status === "current") &&
      lockChecks.every((check) => check.status === "current"),
  };
}

function computeFolderDigest(root: string): string {
  const files: string[] = [];
  collectFiles(root, files);
  files.sort((left, right) => left.localeCompare(right));
  const hash = createHash("sha256");
  for (const path of files) {
    hash.update(relative(root, path).split("\\").join("/"));
    hash.update(readFileSync(path));
  }
  return hash.digest("hex");
}

function collectFiles(directory: string, files: string[]): void {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (![".git", "node_modules"].includes(entry.name)) collectFiles(path, files);
    } else if (entry.isFile()) {
      files.push(path);
    }
  }
}
