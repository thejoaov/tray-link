# Workspace Managers: Bun vs pnpm

## Bun Workspaces

```json
// package.json
{
  "workspaces": ["apps/*", "packages/*"]
}
```

### Catalog pattern (Bun)

Bun supports `catalog:` protocol for pinning shared dependency versions. Declare in root `package.json`:

```json
{
  "catalog": {
    "typescript": "^5.9.3",
    "zod": "^3.24.0",
    "@t3-oss/env-nextjs": "^0.11.0"
  }
}
```

Consume in any workspace:

```json
{
  "dependencies": {
    "zod": "catalog:",
    "typescript": "catalog:"
  }
}
```

For versioned groups (e.g., multiple React versions in the same repo):

```json
{
  "catalogs": {
    "react18": { "react": "^18.3.1" },
    "react19": { "react": "^19.0.0" }
  }
}
```

Consume: `"react": "catalog:react18"`

### Running commands

```bash
# Run in all workspaces (via Turborepo)
bun run build

# Run in a specific workspace
bun --filter @myapp/web run dev

# Or via workspace helper
bun f web run dev
```

---

## pnpm Workspaces

```yaml
# pnpm-workspace.yaml
packages:
  - "apps/*"
  - "packages/*"
  - "tooling/*"
```

### Catalog pattern (pnpm)

```yaml
# pnpm-workspace.yaml
packages:
  - "apps/*"
  - "packages/*"

catalog:
  typescript: "^5.9.3"
  zod: "^3.24.0"

catalogs:
  react18:
    react: "^18.3.1"
  storybook:
    "@storybook/react": "^8.6.0"
```

Consume:

```json
{
  "dependencies": {
    "zod": "catalog:",
    "react": "catalog:react18"
  }
}
```

### Running commands

```bash
# Run in a specific workspace
pnpm --filter @myapp/web dev

# Run in all workspaces
pnpm -r run build
```

---

## Version Pinning Strategy

1. **Always pin exact versions in `catalog`** for framework deps (React, Next.js, Expo) — prevents accidental upgrades across the repo.
2. **Use `^` range only for tooling** (Biome, TypeScript, Lefthook) where patch updates are safe.
3. **Never mix catalog and direct version strings** for the same package across workspaces — pick one.
4. **For internal packages**, always use `workspace:*` to reference them:

```json
{
  "dependencies": {
    "@myapp/db": "workspace:*",
    "@myapp/auth": "workspace:*"
  }
}
```
