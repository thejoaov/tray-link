---
name: ai-release-notes
description: Use when setting up or improving a GitHub Actions release workflow that generates release notes automatically using an LLM. Covers resolving the git tag range between releases, collecting commits, calling the Gemini API to group and summarize changes, stripping markdown fencing artifacts, and falling back to a plain commit list when no API key is available. Trigger when the user asks about automated release notes, AI changelog generation, or GitHub Actions release workflow.
---

# AI-Generated Release Notes in GitHub Actions

A self-contained shell pattern for generating release notes from git history using an LLM. Drops into any existing GitHub Actions release workflow. No extra tooling or dependencies — just `curl`, `jq`, and a Gemini API key stored as a secret.

## How it works

1. Resolve the two most recent tags to define the commit range
2. Collect `git log` between them as a plain list
3. Send to Gemini with a prompt that requests grouped, user-facing Markdown
4. Strip any accidental code fences from the response
5. Fall back to a plain commit list if `GEMINI_API_KEY` is not set

## Complete workflow steps

Add these steps to any `create-release` job that already has `actions/checkout@v4` with `fetch-depth: 0`:

```yaml
- name: Resolve tags and commit range
  id: git_range
  run: |
    set -euo pipefail

    current_tag=$(git tag --sort=-creatordate | head -n1 || true)
    if [ -z "${current_tag}" ]; then
      echo "No git tags found." && exit 1
    fi

    previous_tag=$(git tag --sort=-creatordate | grep -v "^${current_tag}$" | head -n1 || true)

    echo "current_tag=${current_tag}" >> "$GITHUB_OUTPUT"
    echo "previous_tag=${previous_tag}" >> "$GITHUB_OUTPUT"

    if [ -n "${previous_tag}" ]; then
      echo "range=${previous_tag}..${current_tag}" >> "$GITHUB_OUTPUT"
    else
      echo "range=${current_tag}" >> "$GITHUB_OUTPUT"
    fi

- name: Collect commits
  id: changelog
  run: |
    set -euo pipefail

    if [ -n "${{ steps.git_range.outputs.previous_tag }}" ]; then
      git log --pretty='- %s (%h)' "${{ steps.git_range.outputs.range }}" > commits.md
    else
      git log --pretty='- %s (%h)' -n 30 "${{ steps.git_range.outputs.current_tag }}" > commits.md
    fi

    [ -s commits.md ] || echo "- No user-facing commits found." > commits.md

- name: Generate release notes
  env:
    GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
  run: |
    set -euo pipefail

    previous_tag="${{ steps.git_range.outputs.previous_tag }}"
    [ -z "${previous_tag}" ] && previous_tag="N/A"

    if [ -n "${GEMINI_API_KEY}" ]; then
      commits_payload=$(cat commits.md)

      jq -n \
        --arg current_tag "${{ steps.git_range.outputs.current_tag }}" \
        --arg previous_tag "${previous_tag}" \
        --arg commits "${commits_payload}" \
        '{
          contents: [{
            role: "user",
            parts: [{
              text: ("You generate concise GitHub release notes in markdown. Group notable changes into sections and keep it practical for users. Return plain markdown only — no code fences, no ```markdown wrapper.\n\nCurrent tag: " + $current_tag + "\nPrevious tag: " + $previous_tag + "\n\nCommits:\n" + $commits)
            }]
          }]
        }' > ai_payload.json

      curl -sS \
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}" \
        -H "Content-Type: application/json" \
        -d @ai_payload.json > ai_response.json

      # Extract text, strip any accidental fenced code block wrappers, trim leading blank lines
      jq -r '[.candidates[0].content.parts[]?.text] | join("\n") // empty' ai_response.json \
        | sed -E '/^[[:space:]]*```[[:alpha:]-]*[[:space:]]*$/d; /^[[:space:]]*```[[:space:]]*$/d' \
        | awk 'BEGIN { started=0 } { if (started || $0 !~ /^[[:space:]]*$/) { started=1; print } }' \
        > release_notes.md
    fi

    # Fallback: plain commit list
    if [ ! -s release_notes.md ]; then
      {
        echo "## Changes"
        cat commits.md
      } > release_notes.md
    fi

- name: Publish release
  uses: softprops/action-gh-release@v2
  with:
    tag_name: ${{ steps.git_range.outputs.current_tag }}
    body_path: release_notes.md
    files: |
      dist/*
```

## Required secrets

| Secret | Description |
|---|---|
| `GEMINI_API_KEY` | Gemini API key. If absent, the workflow falls back to a plain commit list — no failure. |

## Customizing the model

Replace `gemini-2.5-flash-lite` with any model available to your key:

```yaml
"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}"
```

`gemini-2.5-flash-lite` is recommended: fast, cheap, and the release notes task is not complex.

## Prompt customization

The prompt in the `jq -n` block is the only part you need to edit to change style. Common adjustments:

- **Language**: add `"Write in Portuguese."` at the start
- **Sections**: specify which groups you want (`## Features`, `## Bug Fixes`, `## Breaking Changes`)
- **Tone**: `"Keep it brief. One sentence per change."` or `"Include context for each change."`
- **Filtering**: `"Skip commits that start with 'chore' or 'docs'."` 

## Notes

- The `sed` strip is defensive: some models occasionally wrap the entire response in a `\`\`\`markdown` block despite the explicit instruction not to.
- The `awk` trim removes leading blank lines that can appear before the first heading.
- `fetch-depth: 0` on `actions/checkout` is required to have full tag history; without it, `git tag` returns nothing.
