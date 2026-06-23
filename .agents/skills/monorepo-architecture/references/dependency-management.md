# Dependency Management in Monorepos

## Internal Package References

Always use `workspace:*` — never hardcode version strings for internal packages:

```json
{
  "dependencies": {
    "@myapp/db": "workspace:*",
    "@myapp/auth": "workspace:*",
    "@myapp/env": "workspace:*"
  }
}
```

`workspace:*` resolves to the local package during dev and the published version during release. It ensures changes propagate correctly through Turborepo's dependency graph.

---

## Shared External Dependencies

Use the catalog pattern (Bun or pnpm — see `workspace-managers.md`) to pin versions once at the root and consume them everywhere without duplication.

**What goes in the catalog:**
- Framework versions: `react`, `next`, `expo`
- Shared utility libraries: `zod`, `typescript`, `@types/node`
- Auth/ORM: `better-auth`, `prisma`, `drizzle-orm`
- Env validators: `@t3-oss/env-nextjs`, `@t3-oss/env-core`

**What stays local (not in catalog):**
- Dependencies only one workspace uses
- Dev tools with frequent updates (formatter, linter)

---

## Peer Dependencies

Packages that wrap UI libraries (like `@myapp/ui`) should declare React as a peer dependency, not a direct dependency:

```json
// packages/ui/package.json
{
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "react": "catalog:",
    "react-dom": "catalog:"
  }
}
```

This prevents the consuming app from bundling two copies of React.

---

## Avoiding Version Drift

1. **One version of each external library** — if `zod` appears in multiple `package.json` files with different versions, deduplicate by moving it to the catalog.
2. **Use `sherif`** to audit for mismatched versions across workspaces:
   ```bash
   bunx sherif
   ```
3. **Use Renovate or Dependabot** for automated dependency updates — configure them to update the catalog entries, not individual workspace files.

---

## TypeScript Config Inheritance

Every workspace `tsconfig.json` must extend a base:

```json
// apps/web/tsconfig.json
{
  "extends": "@myapp/typescript/nextjs",
  "include": ["src", "next.config.ts"],
  "exclude": ["node_modules"]
}
```

The base configs live in `tooling/typescript/` (or `packages/config/`) and set:
- `strict: true`
- `moduleResolution: "bundler"` (for Bun/Next.js/Vite)
- `target`, `lib`, `jsx` settings appropriate to each environment
