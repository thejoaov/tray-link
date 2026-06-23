---
name: feature-management
description: Full lifecycle for planning and documenting a new feature. Use when starting a new feature, writing a PRD from scratch with an interview, creating a technical spike for unknowns, or generating an implementation task checklist. Covers the spike → PRD → tasks workflow with versioned, non-destructive documents under docs/[feature-name]/. Trigger when the user says "plan a feature", "let's start a new feature", "write a spike", "create tasks for this", or when entering Plan mode.
---

# Feature Management & Planning

This skill guides the full lifecycle of a new feature: research, requirements, and execution tracking. It produces versioned documents under `docs/[feature-name]/` that serve as the persistent record of every decision made.

> If you already have a conversation to capture and just need a PRD written quickly, use `to-prd` instead. This skill is for the full planning workflow including the interview.

## Document Structure

Every feature gets its own directory:

```text
docs/
  [feature-name]/
    spike.md      Optional — technical research and feasibility
    prd.md        Required — product requirements and architecture impact
    tasks.md      Optional — implementation checklist
```

All files use YAML frontmatter with `created_at` and `last_modified_at` timestamps:

```yaml
---
created_at: "YYYY-MM-DD HH:MM:SS"
last_modified_at: "YYYY-MM-DD HH:MM:SS"
---
```

## Versioning Rules

- `spike.md` and `tasks.md` are **immutable once written** — do not modify them for new phases. Create a new directory (`[feature-name]-v2/`) instead.
- `prd.md` is a **living document**, but updates are non-destructive: wrap deprecated text in slashes (`/old text/`) and append to a `## Rectifications` section with the date and rationale. Always update `last_modified_at`.

## Step 1 — Spike (optional)

Before writing requirements, ask: are there significant technical unknowns, API constraints, database migration risks, or architectural questions?

If yes, create `docs/[feature-name]/spike.md` first.

A spike is a time-boxed investigation. Its only job is to produce concrete recommendations that directly inform the PRD. Keep it factual — findings, constraints, conclusions.

```markdown
---
created_at: "YYYY-MM-DD HH:MM:SS"
last_modified_at: "YYYY-MM-DD HH:MM:SS"
---

# Spike — [Feature Name]

## Goal

What question is this spike trying to answer?

## Findings

What was discovered? Include API constraints, schema considerations, third-party limitations.

## Conclusion

What should the PRD decide based on this spike?
```

## Step 2 — PRD (required)

Run an interview with the user before writing the PRD. Ask targeted questions about:

- Who the user is (actor) and what problem they have
- The happy path and the most important edge cases
- Auth and permission requirements
- Which packages and layers will be affected
- Any hard constraints (performance, offline support, compatibility)

After the interview, write `docs/[feature-name]/prd.md` using the template:

```markdown
---
created_at: "YYYY-MM-DD HH:MM:SS"
last_modified_at: "YYYY-MM-DD HH:MM:SS"
---

# PRD — [Feature Name]

## 1. Overview & Objectives

Why are we building this? What problem does it solve and what is the success criteria?

## 2. Functional Requirements

- **FR-01:** [Detailed description]
- **FR-02:** [Detailed description]

## 3. Architecture & Package Impact

- **`packages/db`:** Schema additions or modifications
- **`packages/api`:** New procedures, routers, service methods
- **`packages/auth`:** Auth guards, roles, session requirements
- **`apps/web`:** UI components, routes, pages
- **`apps/native`:** Native screens, navigation
- **`packages/env`:** New environment variables needed

## 4. User Journeys

Step-by-step walk-through of the main flows (happy path + key alternatives).

## 5. Open Questions

- [Unresolved product decision]
- [Technical constraint requiring clarification]

## 6. Rectifications

- [No rectifications yet]
```

**Rules:**
- Be exhaustive on business logic — include happy paths, alternative flows, and edge cases
- Do not include file paths or code snippets unless a specific type or schema shape was decided
- Do not include time estimates
- Always end with `## Open Questions` — never leave this section empty if there are unresolved items
- After writing, ask the user to resolve any open questions using structured multiple-choice where possible

## Step 3 — Tasks (optional)

Create `docs/[feature-name]/tasks.md` when the implementation needs to be tracked in detail — especially for features touching multiple packages or requiring coordination.

```markdown
---
created_at: "YYYY-MM-DD HH:MM:SS"
last_modified_at: "YYYY-MM-DD HH:MM:SS"
---

# Implementation Checklist — [Feature Name]

## Summary of Completion

0% complete — initial planning phase.

## Tasks

### 1. [Task Group] - (done when finished)

Brief description of what this group covers.

- (done) - [Completed subtask]
- [ ] [Pending subtask — include exact files, services, and methods affected]
```

**Rules:**
- Start with `## Summary of Completion` — update it as work progresses
- Group tasks by package or domain boundary (`packages/db`, `packages/api`, `apps/web`, etc.)
- Each subtask must name the exact files, service classes, routers, or methods involved — enough detail for another developer or agent to implement with no ambiguity
- Mark completed main tasks with ` - (done)` appended to the heading
- Mark completed subtasks with `(done) - ` prepended to the list item
- No time estimates
