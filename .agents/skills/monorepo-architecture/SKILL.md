---
name: monorepo-architecture
description: Use when setting up, organizing, or reasoning about a TypeScript monorepo. Covers workspace managers (Bun, pnpm), Turborepo pipelines and caching, package boundary conventions (apps/packages/tooling tiers), dependency management with catalogs and version pinning, shared tooling packages, and cross-workspace build orchestration. Trigger when the user asks about monorepo structure, where to add a new package, how to configure Turborepo tasks, or how to manage shared dependencies.
---

# Monorepo Architecture

Personal conventions for TypeScript monorepos. These are opinionated defaults — adapt per project.

## References

Consult these files for detailed guidance:

```text
references/
  workspace-managers.md    Bun vs pnpm workspaces, catalogs, version pinning strategies
  turborepo.md             Pipeline configuration, caching, globalEnv, task dependencies
  package-boundaries.md    apps/, packages/, tooling/ tiers and what belongs where
  dependency-management.md Shared deps, catalog patterns, peer deps, internal packages
```

## When to use

- **Starting a new monorepo** — choosing workspace manager, setting up Turborepo, defining the initial package topology
- **Adding a new app or package** — deciding which tier it belongs to and how it integrates with the build pipeline
- **Debugging build issues** — understanding task dependencies, cache invalidation, and globalEnv
- **Structuring shared tooling** — tsconfig base, linting config, tailwind preset as packages

## Quick Reference

### Directory tiers

| Tier | Path | Purpose |
|---|---|---|
| Apps | `apps/*` | Runnable applications (web, native, docs, cli) |
| Packages | `packages/*` | Shared libraries consumed by apps or other packages |
| Tooling | `tooling/*` | Config-only packages (tsconfig, biome, tailwind) — optional tier |

### Package naming

Internal packages use the `@scope/name` convention. The scope is always the project name or org handle:

```
@myapp/api
@myapp/auth
@myapp/db
@myapp/ui
@myapp/env
@myapp/theme
```

### Workspace manager choice

**Prefer Bun** for new projects:
- Unified runtime + package manager
- Native TypeScript execution (no separate tsx/ts-node)
- Faster installs, built-in test runner

**Use pnpm** when:
- The project has strict `node_modules` isolation requirements
- Some dependencies break with Bun's runtime
- CI environment doesn't support Bun well

See `references/workspace-managers.md` for catalog patterns and version pinning.

### Turborepo essentials

Every monorepo task must declare its inputs and outputs explicitly. Never rely on implicit file watching for cache:

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**", ".expo/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "type-check": {
      "dependsOn": ["^build"]
    }
  }
}
```

See `references/turborepo.md` for globalEnv, remote caching, and advanced pipeline patterns.

### Cross-workspace commands

Use a workspace helper script instead of `cd` chains. Pattern used across projects:

```bash
# bun f <workspace> <args>  — run bun commands inside a matched workspace
bun f db run dev
bun f web add zod
bun f native run atlas
```

The helper matches by package name, folder name, short name, or partial match.
