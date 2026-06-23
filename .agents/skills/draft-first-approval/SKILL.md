---
name: draft-first-approval
description: Use when implementing any agent action that has an irreversible or externally visible side effect — sending a message, email, or notification; posting to a public channel; making a payment; deploying to production; deleting data; or calling a third-party API that cannot be undone. The agent must always draft and present the action for explicit user approval before executing it. Trigger when the user asks the agent to send, post, deploy, delete, or perform any action whose side effects cannot be rolled back.
---

# Draft-First Approval

Any agent action with an irreversible or externally visible side effect must be drafted and approved before execution. The agent never assumes permission to act — it shows its work, waits for confirmation, and only then proceeds.

## The rule

> If the action cannot be undone or silently reversed, draft it first.

Examples of actions that require approval:

- Sending an email, SMS, push notification, or chat message
- Posting to a Slack/Discord channel, GitHub issue, or PR comment
- Deploying to a staging or production environment
- Writing to a database record that triggers downstream effects
- Calling a third-party API that sends data externally (Stripe charge, Intercom reply, Twilio SMS)
- Deleting files, records, or resources

## Pattern

### 1. Compose the draft

Prepare the full content of the action — the complete message body, the exact deploy command, the precise API payload — in a format the user can read and verify.

### 2. Present for review

Show the draft explicitly. Make it easy to see what will happen and what the effect will be. Include:
- **What** will be sent/executed/deleted
- **Where** it will go (recipient, environment, endpoint)
- **When** it will take effect (immediately, scheduled)
- Any **irreversible** aspects

Format example for a message action:
```
Draft ready for your review:

To: alice@example.com
Subject: Your order has shipped

Hi Alice,

Your order #1234 has shipped. Estimated delivery: June 25.

Track it here: https://...

---
Reply "send" to confirm, or tell me what to change.
```

### 3. Wait for explicit confirmation

Do not proceed unless the user explicitly confirms. Accepted confirmations: `send`, `confirm`, `yes`, `approve`, `do it`, or equivalent unambiguous affirmation.

Ambiguous responses (`ok`, `sure`, `sounds good`) should trigger a clarification question before acting, not immediate execution.

### 4. Execute and confirm

After executing, report the outcome immediately:
- Success: what was done, any reference IDs (message ID, deployment URL, etc.)
- Failure: the exact error, what state the system is in, and whether a retry is safe

## Automation tier (for agents that process queues)

When an agent handles items automatically (e.g., a support ticket queue), use a confidence-based tier:

| Tier | Condition | Behavior |
|---|---|---|
| Auto-send | High confidence, low-stakes category | Execute without asking |
| Draft for review | Medium confidence or high-stakes category | Present draft, wait for approval |
| Escalate to human | Low confidence or novel category | Flag for human handling, do not draft |

The whitelist of auto-send categories should be **conservative by default** and can be expanded only after observing a sustained low error rate (e.g., reopen rate < 15% over 30 days).

## What NOT to do

- Do not execute and then report what was done — the user cannot undo it
- Do not interpret silence as confirmation
- Do not send a "are you sure?" question without including the full draft — the user needs to see what they're approving
- Do not truncate the draft ("I'll send something like...") — show the exact content
