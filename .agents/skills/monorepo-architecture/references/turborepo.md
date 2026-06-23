# Turborepo: Pipelines, Caching, and globalEnv

## Core Concepts

Turborepo caches task outputs keyed by:
1. The task's input files (source + config)
2. The task's environment variables declared in `globalEnv` or per-task `env`
3. The resolved dependency graph

If any of those change, the cache is invalidated. If none change, Turborepo replays the cached output instantly.

---

## Standard `turbo.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "ui": "tui",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**", ".expo/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "type-check": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "db:generate": {
      "cache": false
    },
    "db:push": {
      "cache": false
    },
    "db:migrate": {
      "cache": false
    },
    "db:studio": {
      "cache": false,
      "persistent": true
    }
  }
}
```

**Rules:**
- `dependsOn: ["^build"]` means "build all dependencies first"
- `dependsOn: ["build"]` (no `^`) means "build this package's own `build` task first"
- Database tasks must always have `"cache": false`
- Long-running servers use `"persistent": true`

---

## `globalEnv`

Environment variables that affect the build but aren't specific to one package must be declared in `globalEnv`. Missing a variable here means the cache won't invalidate when the env changes.

```json
{
  "globalEnv": [
    "NODE_ENV",
    "DATABASE_URL",
    "NEXT_PUBLIC_APP_URL",
    "EXPO_PUBLIC_API_URL",
    "BETTER_AUTH_SECRET",
    "STRIPE_SECRET_KEY",
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY"
  ]
}
```

**Rule:** Any `NEXT_PUBLIC_*` or `EXPO_PUBLIC_*` variable must be in `globalEnv` — they're baked into client bundles at build time.

---

## Task-level `env`

For secrets that only affect one workspace:

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "env": ["STRIPE_WEBHOOK_SECRET"],
      "outputs": ["dist/**"]
    }
  }
}
```

---

## Remote Caching (optional)

Enable in CI with Vercel Remote Cache or self-hosted Turborepo cache:

```bash
turbo run build --token=$TURBO_TOKEN --team=$TURBO_TEAM
```

---

## Common Pitfalls

| Problem | Fix |
|---|---|
| Cache hit but missing env changes | Add the var to `globalEnv` |
| `dev` caches stale output | Add `"cache": false` |
| Build doesn't pick up internal package changes | Add `dependsOn: ["^build"]` |
| Turbo running too many tasks at once | Use `--concurrency=4` or `"concurrency"` in config |
