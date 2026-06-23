---
name: to-prd
description: Synthesize the current conversation into a PRD saved under docs/. Use after discussing a feature or change with the agent — no interview, just capture what has already been decided, surface open questions, and write the document. Trigger when the user says "write a PRD", "document this", "save this as a spec", or after a design discussion that needs to be captured before implementation starts.
---

This skill synthesizes what has already been discussed into a PRD. Do NOT interview the user — capture and structure what you already know from the conversation and codebase.

## Process

1. **Explore the codebase** to understand the current state of the areas touched by this feature, if you haven't already. Note the existing modules, boundaries, and naming conventions — use them throughout the document.

2. **Identify the seams** — the points in the codebase where this feature will connect to existing code. Prefer existing seams to new ones. The fewer seams, the better; the ideal is one. State which packages and layers are involved (`packages/api`, `packages/db`, `apps/web`, etc.).

3. **Write the PRD** using the template below. Save it to `docs/[feature-name]/prd.md`. Create the directory if it doesn't exist.

4. **Surface open questions** at the end of the document — anything unresolved, ambiguous, or requiring a product decision. Do not block writing the PRD on these; surface them so the user can address them separately.

## Template

```markdown
---
created_at: "YYYY-MM-DD HH:MM:SS"
last_modified_at: "YYYY-MM-DD HH:MM:SS"
---

# PRD — [Feature Name]

## Problem Statement

What problem does this solve? Describe it from the user's perspective, not the implementation's.

## Solution

What will be built? Describe it from the user's perspective.

## User Stories

A numbered list covering all aspects of the feature. Be exhaustive.

1. As a [actor], I want [capability], so that [benefit].
2. ...

## Implementation Decisions

The modules and boundaries involved. Do not include file paths or code snippets unless a specific shape (schema, type, state machine) was already decided in the conversation — if so, include only the decision-relevant parts.

- **Packages touched:** `packages/api`, `packages/db`, etc.
- **New procedures / endpoints:** ...
- **Schema changes:** ...
- **Auth / permission requirements:** ...
- **Architectural decisions already made:** ...

## Testing Decisions

- Which behavior will be tested (external-facing, not implementation details)
- Which modules will have tests
- Prior art in the codebase for similar tests

## Out of Scope

What is explicitly not included in this PRD.

## Open Questions

- [Question requiring product or technical decision]
- ...

## Rectifications

- [No rectifications yet]
```

## Rules

- **Save location:** always `docs/[feature-name]/prd.md`. Create `docs/` at the project root if it doesn't exist.
- **Frontmatter HELMET:** always include `created_at` and `last_modified_at` timestamps.
- **Non-destructive updates:** if the PRD already exists and you are updating it, never delete old requirements. Wrap deprecated text in slashes (e.g. `/old text/`) and append to the `## Rectifications` section with a date and rationale.
- **Domain vocabulary:** use the project's existing naming conventions — package names, entity names, service names. Do not invent new terms.
- **No time estimates:** do not include story points, hours, or deadlines.
