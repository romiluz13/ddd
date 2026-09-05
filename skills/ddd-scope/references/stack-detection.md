# Resolve versions for the touched surface

Start from the files and integrations needed for the task. Inspect their imports
and configuration, then the relevant package and runtime metadata. A manifest
range is a constraint, not an installed version; lockfiles describe a resolution,
while installed metadata identifies what local checks actually execute.

| Ecosystem | Useful local sources |
|---|---|
| JavaScript / TypeScript | package.json, the project's npm/pnpm/yarn/Bun lockfile, installed package.json, shipped declarations, runtime version |
| Python | pyproject.toml or requirements, uv/Poetry lockfile, environment package metadata, Python version |
| Rust | Cargo.toml, Cargo.lock, local crate source, compiler version |
| Go | go.mod, go.work, selected module versions, toolchain version; go.sum records checksums, not the selected version set |
| Other languages | Native manifest, resolved dependency metadata, installed package docs, runtime/toolchain version |

Check runtime and deployment configuration only where it constrains the changed
API. For a workspace, resolve dependencies from the package that owns the change.
When local installation and locked resolution disagree, record the difference and
identify the intended target before choosing an API. Do not expose secret values
while inspecting configuration.

Use official versioned docs or release-tagged source for that target. Check
shipped types and release notes for introduction/removal of an API. If the
version cannot be established, record that uncertainty and research a compatible
approach; do not silently adopt the latest examples or upgrade the dependency.

Discover missing official sources automatically. An unresolved version or private
package requires a specific question only when accessible local and official
material cannot resolve it. Maintain findings in the task's Documentation basis.
