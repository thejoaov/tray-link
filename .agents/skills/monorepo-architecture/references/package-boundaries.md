# Package Boundaries: apps, packages, tooling

## The Three-Tier Model

```
apps/           Runnable processes — servers, clients, CLIs
packages/       Shared library code — imported by apps or other packages
tooling/        Config-only packages — no runtime exports, just config files
```

`tooling/` is optional. For simpler projects, collapse shared config into the relevant `packages/` package or the root.

---

## `apps/` Tier

Apps are the leaf nodes of the dependency graph. They:
- Import from `packages/*` but are never imported by other packages
- Own their runtime environment (web server, native app, CLI binary)
- Have their own Next.js / Expo / Bun entry points

**Typical apps:**
```
apps/web/        Next.js app (SSR + API routes / Route Handlers)
apps/native/     Expo React Native app
apps/cli/        Bun CLI script (ingestion, migrations, release tooling)
apps/docs/       Documentation site (Fumadocs, Starlight)
```

---

## `packages/` Tier

Packages are shared libraries. They:
- Are imported via `workspace:*` by apps and other packages
- Must declare proper `exports` in `package.json`
- Should have zero or minimal side effects at import time
- Own a clear, single domain responsibility

**Standard packages:**

| Package | Responsibility |
|---|---|
| `@scope/api` | tRPC/ORPC routers, service classes, request context |
| `@scope/auth` | Auth config (Better Auth), session types, auth client exports |
| `@scope/db` | ORM schema (Prisma/Drizzle), migrations, seeding, db client |
| `@scope/env` | Validated env contracts split by runtime (server, web, native) |
| `@scope/theme` | Shared design tokens, TailwindCSS preset, color palette |
| `@scope/emails` | React Email templates |
| `@scope/ui` | Shared UI components (web or native) |

**Rule: packages never import from `apps/`.**

---

## `tooling/` Tier (Optional)

Tooling packages are consumed at dev/build time only, never at runtime:

```
tooling/typescript/    Base tsconfig.json files (base, nextjs, expo variants)
tooling/tailwind/      Shared TailwindCSS config preset
tooling/biome/         Shared biome.json config
tooling/github/        Shared GitHub Actions workflow templates
```

They export only config objects or JSON files. No runtime code.

If the project is small, keep these in the relevant `packages/` package (e.g., `packages/config`) or at the root.

---

## Deciding Where New Code Goes

```
Is it runnable (serves HTTP, renders a screen, runs as a CLI)?
  → apps/

Is it shared config with no runtime exports?
  → tooling/ (or root if project is small)

Is it shared library code with exports used by apps or other packages?
  → packages/

Does it belong to an existing package domain (auth, db, api, env)?
  → Add it to that package, don't create a new one

Is it a new domain (e.g., SMS, feature flags, payments)?
  → Create packages/<domain>
```

---

## Internal Package Exports

Every `packages/` package must declare explicit exports:

```json
// packages/db/package.json
{
  "name": "@myapp/db",
  "exports": {
    ".": "./src/index.ts",
    "./client": "./src/client.ts",
    "./schema": "./src/schema/index.ts"
  }
}
```

Consumers import via the exported path, not by reaching into `src/`:

```typescript
// Good
import { db } from "@myapp/db"
import { User } from "@myapp/db/schema"

// Bad — reaches into internals
import { db } from "@myapp/db/src/client"
```
